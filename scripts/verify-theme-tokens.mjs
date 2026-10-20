// Verifies theme tokens are correct end-to-end.
//
// 1. Re-fetches the LIVE registry values (7 base JSONs + themes.ts from GitHub).
// 2. Compares the live values with the local shadcn-data.json. This proves
//    our cached data is up to date — if shadcn changes a value upstream,
//    this check catches it.
// 3. Parses the generated app/theme-tokens.css and compares each declaration
//    against the live values. This proves the CSS generator works AND the
//    generated CSS matches the source.
//
// Exit code: 0 on full PASS, 1 on any FAIL.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../lib/theme/shadcn-data.json");
const CSS_PATH = resolve(__dirname, "../app/theme-tokens.css");

const REGISTRY_BASE = "https://ui.shadcn.com/r/colors";
const THEMES_TS_URL =
  "https://raw.githubusercontent.com/shadcn-ui/ui/15ac1be92b889480010802151324924005918047/apps/v4/registry/themes.ts";

const BASE_NAMES = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"];
// Mirror of fetch-shadcn-data.mjs ACCENT_KEYS. Keep these in sync — they
// are the keys that a theme color overrides on top of the active base.
const ACCENT_KEYS = [
  "primary", "primary-foreground", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar-primary", "sidebar-primary-foreground", "sidebar-ring",
];

let pass = 0;
let fail = 0;
const fails = [];

function ok(label) {
  pass++;
  console.log(`  ✓ ${label}`);
}
function bad(label, detail) {
  fail++;
  fails.push({ label, detail });
  console.log(`  ✗ ${label}\n    ${detail}`);
}
function section(name) {
  console.log(`\n── ${name} ──`);
}

function pickAccentKeys(tokens) {
  const out = {};
  for (const k of ACCENT_KEYS) {
    if (tokens[k] !== undefined) out[k] = tokens[k];
  }
  return out;
}

async function fetchBase(name) {
  const res = await fetch(`${REGISTRY_BASE}/${name}.json`);
  if (!res.ok) throw new Error(`fetch ${name}: ${res.status}`);
  return res.json();
}

async function fetchThemesTs() {
  const res = await fetch(THEMES_TS_URL);
  if (!res.ok) throw new Error(`fetch themes.ts: ${res.status}`);
  return res.text();
}

function findBlock(chunk, key) {
  const idx = chunk.indexOf(key);
  if (idx === -1) return null;
  let i = idx + key.length;
  while (i < chunk.length && /\s/.test(chunk[i])) i++;
  if (chunk[i] !== "{") return null;
  let depth = 1;
  const start = i;
  i++;
  while (i < chunk.length && depth > 0) {
    const c = chunk[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    if (depth === 0) return chunk.slice(start, i + 1);
    i++;
  }
  return null;
}

function parseCssVarsObject(str) {
  const body = str.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  return new Function(`"use strict"; return ({${body}});`)();
}

function parseThemesTs(src) {
  const out = {};
  const nameRegex = /\{\s*name:\s*"([^"]+)"/g;
  let m;
  while ((m = nameRegex.exec(src)) !== null) {
    const { index } = m;
    let depth = 0, end = -1;
    for (let j = index; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) { end = j + 1; break; }
      }
    }
    if (end === -1) continue;
    const chunk = src.slice(index, end);
    const titleMatch = chunk.match(/title:\s*"([^"]+)"/);
    const lightBlock = findBlock(chunk, "light:");
    const darkBlock = findBlock(chunk, "dark:");
    if (!lightBlock || !darkBlock) continue;
    out[m[1]] = {
      title: titleMatch ? titleMatch[1] : m[1],
      light: parseCssVarsObject(lightBlock),
      dark: parseCssVarsObject(darkBlock),
    };
  }
  return out;
}

/**
 * Parse theme-tokens.css back into a map:
 *   { base: { name: { mode: { token: value } } } }
 * Plus accent and chart.
 */
function parseCss(css) {
  // Strip the leading header comment.
  const cssBody = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const result = { base: {}, accent: {}, chart: {} };
  const blockRegex = /\[data-(base|accent|chart)="([^"]+)"\]\[data-mode="(light|dark)"\]\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRegex.exec(cssBody)) !== null) {
    const [, kind, name, mode, body] = m;
    const tokens = {};
    for (const line of body.split("\n")) {
      const decl = line.match(/--([\w-]+)\s*:\s*([^;]+);/);
      if (decl) tokens[decl[1]] = decl[2].trim();
    }
    result[kind][name] ??= {};
    result[kind][name][mode] = tokens;
  }
  return result;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function diffTokens(label, expected, actual) {
  if (deepEqual(expected, actual)) {
    ok(label);
    return;
  }
  const expKeys = Object.keys(expected);
  const actKeys = Object.keys(actual);
  const missing = expKeys.filter((k) => !(k in actual));
  const extra = actKeys.filter((k) => !(k in expected));
  const changed = expKeys
    .filter((k) => k in actual && expected[k] !== actual[k])
    .slice(0, 5)
    .map((k) => `    ${k}: expected "${expected[k]}" got "${actual[k]}"`);
  const parts = [];
  if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
  if (extra.length) parts.push(`extra: ${extra.join(", ")}`);
  if (changed.length) parts.push(`changed:\n${changed.join("\n")}`);
  bad(label, parts.join("; "));
}

async function main() {
  console.log("Re-fetching live registry values…");
  const liveBases = {};
  for (const name of BASE_NAMES) {
    const data = await fetchBase(name);
    liveBases[name] = data.cssVars;
  }
  const liveThemes = parseThemesTs(await fetchThemesTs());

  // 1. Compare local shadcn-data.json vs live registry.
  section("shadcn-data.json ↔ live registry");
  const local = JSON.parse(await readFile(DATA_PATH, "utf8"));

  for (const name of BASE_NAMES) {
    for (const mode of ["light", "dark"]) {
      diffTokens(
        `base ${name}/${mode} matches live registry`,
        local.bases[name][mode],
        liveBases[name][mode],
      );
    }
  }

  // For accents, compare the 11-key reduced set against the live values.
  for (const name of Object.keys(local.accents)) {
    if (!local.accents[name]) continue; // "default"
    const expected = pickAccentKeys(liveThemes[name].light);
    const expectedDark = pickAccentKeys(liveThemes[name].dark);
    diffTokens(
      `accent ${name}/light matches live themes.ts`,
      expected,
      local.accents[name].light,
    );
    diffTokens(
      `accent ${name}/dark matches live themes.ts`,
      expectedDark,
      local.accents[name].dark,
    );
  }

  // 2. Parse theme-tokens.css and compare.
  section("app/theme-tokens.css ↔ live registry");
  const css = await readFile(CSS_PATH, "utf8");
  const parsed = parseCss(css);

  for (const name of BASE_NAMES) {
    for (const mode of ["light", "dark"]) {
      const expected = { ...liveBases[name][mode] };
      delete expected.radius; // we don't emit radius
      const selector = `[data-base="${name}"][data-mode="${mode}"]`;
      const got = parsed.base[name]?.[mode];
      if (!got) {
        bad(`CSS missing ${selector}`, "");
        continue;
      }
      diffTokens(`${selector} matches live values`, expected, got);
    }
  }

  for (const name of Object.keys(local.accents)) {
    if (!local.accents[name]) {
      // "default" — no rule should be generated.
      if (parsed.accent[name]) {
        bad(`accent="${name}" should not generate any rule`, "");
      } else {
        ok(`accent="default" generates no rule`);
      }
      continue;
    }
    const expectedLight = pickAccentKeys(liveThemes[name].light);
    const expectedDark = pickAccentKeys(liveThemes[name].dark);
    diffTokens(
      `[data-accent="${name}"][data-mode="light"] matches live values`,
      expectedLight,
      parsed.accent[name]?.light ?? {},
    );
    diffTokens(
      `[data-accent="${name}"][data-mode="dark"] matches live values`,
      expectedDark,
      parsed.accent[name]?.dark ?? {},
    );
  }

  for (const name of Object.keys(local.accents)) {
    if (!local.accents[name]) {
      if (parsed.chart[name]) {
        bad(`chart="${name}" should not generate any rule`, "");
      } else {
        ok(`chart="default" generates no rule`);
      }
      continue;
    }
    const expectedLight = {};
    const expectedDark = {};
    for (let i = 1; i <= 5; i++) {
      const k = `chart-${i}`;
      expectedLight[k] = pickAccentKeys(liveThemes[name].light)[k];
      expectedDark[k] = pickAccentKeys(liveThemes[name].dark)[k];
    }
    diffTokens(
      `[data-chart="${name}"][data-mode="light"] matches live values`,
      expectedLight,
      parsed.chart[name]?.light ?? {},
    );
    diffTokens(
      `[data-chart="${name}"][data-mode="dark"] matches live values`,
      expectedDark,
      parsed.chart[name]?.dark ?? {},
    );
  }

  // 3. Summary.
  console.log(`\n────────────────`);
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  if (fail > 0) {
    console.log("\nFailures:");
    for (const f of fails) console.log(`  • ${f.label}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
