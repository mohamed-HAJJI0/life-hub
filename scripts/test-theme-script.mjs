// Regression test for the no-FOUC inline script (`lib/theme/theme-script.ts`).
//
// The script is a string of JavaScript injected into <head>. It is easy to
// break it in ways that no type-checker or linter catches — a single
// syntax error means the whole script silently never runs, and the theme
// flashes the wrong colours on every page load.
//
// This test evaluates the real script source against a fake DOM and checks
// the precedence rules:
//
//   1. localStorage (the per-device choice) wins when present.
//   2. With no local theme, the server-rendered (account-wide) theme on
//      <html> is PRESERVED — not overwritten with the built-in defaults.
//   3. modePref "system" resolves through prefers-color-scheme.
//
// Run: node scripts/test-theme-script.mjs

import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// theme-script.ts is plain ESM with one extensionless relative import,
// which Node's ESM resolver won't resolve. Load a shimmed copy with an
// explicit .ts specifier so we exercise the real script source.
const shimPath = resolve(ROOT, "lib/theme/_theme-script.shim.mjs");
const source = readFileSync(
  resolve(ROOT, "lib/theme/theme-script.ts"),
  "utf8",
);
writeFileSync(
  shimPath,
  source.replace('"./constants"', '"./constants.ts"'),
  "utf8",
);

let themeScript;
try {
  ({ themeScript } = await import(`file://${shimPath.replace(/\\/g, "/")}`));
} finally {
  unlinkSync(shimPath);
}

function makeEl(attributes = {}) {
  const attrs = { ...attributes };
  const classes = new Set();
  return {
    attributes: attrs,
    classes,
    el: {
      getAttribute: (n) => (n in attrs ? attrs[n] : null),
      setAttribute: (n, v) => {
        attrs[n] = String(v);
      },
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
        toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
      },
    },
  };
}

function run({ ssr = {}, stored = null, prefersDark = false }) {
  const { el, attributes, classes } = makeEl(ssr);

  const fakeWindow = {
    matchMedia: () => ({
      matches: prefersDark,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const fakeDocument = { documentElement: el };
  const fakeStorage = {
    getItem: (k) => (k === "life-hub:theme" ? stored : null),
    setItem: () => {},
  };

  new Function("document", "window", "localStorage", themeScript)(
    fakeDocument,
    fakeWindow,
    fakeStorage,
  );

  return { attributes, classes };
}

let failures = 0;
function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const SSR_THEME = {
  "data-base": "taupe",
  "data-accent": "rose",
  "data-chart": "emerald",
  "data-mode-pref": "dark",
};

console.log("\n1) no local theme -> the server-rendered theme is preserved");
{
  const r = run({ ssr: SSR_THEME, stored: null, prefersDark: false });
  check("base kept", r.attributes["data-base"] === "taupe", r.attributes["data-base"]);
  check("accent kept", r.attributes["data-accent"] === "rose", r.attributes["data-accent"]);
  check("chart kept", r.attributes["data-chart"] === "emerald", r.attributes["data-chart"]);
  check("modePref dark -> data-mode dark", r.attributes["data-mode"] === "dark", r.attributes["data-mode"]);
  check(".dark class added", r.classes.has("dark"));
}

console.log("\n2) no local theme and no SSR attributes -> built-in defaults");
{
  const r = run({ ssr: {}, stored: null, prefersDark: false });
  check("base defaults to neutral", r.attributes["data-base"] === "neutral", r.attributes["data-base"]);
  check("accent defaults to default", r.attributes["data-accent"] === "default");
  check("chart defaults to default", r.attributes["data-chart"] === "default");
  check("modePref system + light OS -> light", r.attributes["data-mode"] === "light");
  check("no .dark class", !r.classes.has("dark"));
}

console.log("\n3) a local theme exists -> the device-local one wins over SSR");
{
  const stored = JSON.stringify({
    base: "zinc",
    accent: "blue",
    chart: "default",
    modePref: "light",
  });
  const r = run({ ssr: SSR_THEME, stored, prefersDark: true });
  check("base from localStorage", r.attributes["data-base"] === "zinc", r.attributes["data-base"]);
  check("accent from localStorage", r.attributes["data-accent"] === "blue");
  check("chart from localStorage", r.attributes["data-chart"] === "default");
  check("modePref light -> light even on a dark OS", r.attributes["data-mode"] === "light", r.attributes["data-mode"]);
  check("no .dark class", !r.classes.has("dark"));
}

console.log("\n4) modePref system -> resolved through prefers-color-scheme");
{
  const stored = JSON.stringify({
    base: "zinc",
    accent: "blue",
    chart: "default",
    modePref: "system",
  });
  const r = run({ ssr: {}, stored, prefersDark: true });
  check("dark OS -> data-mode dark", r.attributes["data-mode"] === "dark", r.attributes["data-mode"]);
  check(".dark class added", r.classes.has("dark"));
}

console.log("\n5) unparseable localStorage -> falls back to SSR, not the defaults");
{
  const r = run({ ssr: SSR_THEME, stored: "{not json", prefersDark: false });
  check("base kept from SSR", r.attributes["data-base"] === "taupe", r.attributes["data-base"]);
  check("mode from the SSR modePref", r.attributes["data-mode"] === "dark");
}

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`,
);
process.exit(failures === 0 ? 0 : 1);
