// Fetches the canonical shadcn v4 theme data from the live registry and
// writes `lib/theme/shadcn-data.json`. Run with `node scripts/fetch-shadcn-data.mjs`.
//
// Sources (pinned, the script writes them out on every run):
//   - 7 base themes: https://ui.shadcn.com/r/colors/{name}.json
//   - All 24 themes:  https://github.com/shadcn-ui/ui/blob/15ac1be9/apps/v4/registry/themes.ts
//
// Output shape:
//   {
//     bases: { [name]: { label, light: {token→oklch}, dark: {token→oklch} } },
//     accents: { default: null, [name]: { label, light, dark } }  // 24 accents
//   }
//
// "Accent" entries only carry the override keys (primary, primary-foreground,
// secondary, secondary-foreground, chart-1..5, sidebar-primary,
// sidebar-primary-foreground) — 11 keys per mode. The 7 base names appear in
// `accents` too, with just those 11 keys extracted from their full token set.
// This matches the behavior of /create: when you pick "Zinc" as theme color,
// only the primary-related tokens are applied; surfaces stay with the active
// base.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../lib/theme/shadcn-data.json");

const BASE_NAMES = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"];
// The 11 keys that a theme color overrides on top of the active base.
// Derived from shadcn's pinned registry/themes.ts: every accent (named
// theme colors like `blue`, `rose`, `yellow` AND base names like `zinc` when
// used as a theme color) carries these specific tokens, while surfaces
// (background, card, popover, muted, accent, secondary, border, input,
// destructive, sidebar surfaces, etc.) stay with the base.
//
// Rule #1: this list is derived from the source — see fetch script and
// verify-theme-tokens.mjs. Do NOT hand-edit; if the upstream list changes,
// both scripts must change together.
const ACCENT_KEYS = [
  "primary",
  "primary-foreground",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-ring",
];

const REGISTRY_BASE = "https://ui.shadcn.com/r/colors";
const THEMES_TS_URL =
  "https://raw.githubusercontent.com/shadcn-ui/ui/15ac1be92b889480010802151324924005918047/apps/v4/registry/themes.ts";

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickAccentKeys(tokens) {
  const out = {};
  for (const k of ACCENT_KEYS) {
    if (tokens[k] !== undefined) out[k] = tokens[k];
  }
  return out;
}

async function fetchBase(name) {
  const url = `${REGISTRY_BASE}/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const data = await res.json();
  return {
    label: titleCase(name),
    light: data.cssVars.light,
    dark: data.cssVars.dark,
  };
}

/**
 * Parse the themes.ts file. The file is a TypeScript module that exports a
 * const array of theme objects. We split the file on `name:` boundaries
 * (each theme object starts with `{ name:`) and parse each chunk separately,
 * since the chunks are self-contained.
 */
function parseThemesTs(src) {
  const out = {};
  // Each theme entry starts with `{ name: "X", ...`. Find each `name:` and
  // extract a chunk up to the matching closing brace at depth 0.
  const starts = [];
  const nameRegex = /\{\s*name:\s*"([^"]+)"/g;
  let m;
  while ((m = nameRegex.exec(src)) !== null) {
    starts.push({ name: m[1], index: m.index });
  }

  for (let i = 0; i < starts.length; i++) {
    const { name, index } = starts[i];
    // Walk forward, tracking brace depth, to find the matching `}`.
    let depth = 0;
    let end = -1;
    for (let j = index; j < src.length; j++) {
      const c = src[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = j + 1;
          break;
        }
      }
    }
    if (end === -1) continue;
    const chunk = src.slice(index, end);

    // Extract title.
    const titleMatch = chunk.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : titleCase(name);

    // Find the light and dark blocks using brace tracking.
    const lightBlock = findBlock(chunk, "light:");
    const darkBlock = findBlock(chunk, "dark:");
    if (!lightBlock || !darkBlock) continue;

    out[name] = {
      label: title,
      light: parseCssVarsObject(lightBlock),
      dark: parseCssVarsObject(darkBlock),
    };
  }
  return out;
}

/**
 * In `chunk`, find the object literal that starts after `key:`. Returns the
 * substring including the wrapping braces, or null if not found.
 */
function findBlock(chunk, key) {
  const idx = chunk.indexOf(key);
  if (idx === -1) return null;
  // Skip past the key and the colon, then any whitespace.
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
  // The themes.ts object literals use bare CSS variable names as keys (e.g.
  // `card:` or `"card-foreground":`). Strip the surrounding braces, then
  // safely evaluate the body as a JS object literal. We only ever run this
  // on data fetched from a pinned GitHub source, so the eval surface is
  // small and known.
  const body = str.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  const fn = new Function(`"use strict"; return ({${body}});`);
  return fn();
}

async function main() {
  console.log("→ Fetching 7 base theme JSONs from", REGISTRY_BASE);
  const bases = {};
  for (const name of BASE_NAMES) {
    const data = await fetchBase(name);
    bases[name] = data;
    console.log(`  ✓ ${name}`);
  }

  console.log("→ Fetching themes.ts from GitHub");
  const res = await fetch(THEMES_TS_URL);
  if (!res.ok) throw new Error(`fetch ${THEMES_TS_URL} → ${res.status}`);
  const themesSrc = await res.text();
  const allThemes = parseThemesTs(themesSrc);
  const found = Object.keys(allThemes).sort();
  console.log(`  ✓ parsed ${found.length} themes: ${found.join(", ")}`);

  // Sanity: confirm we have all 24 names we expect.
  const expected = [
    "amber", "blue", "cyan", "emerald", "fuchsia", "green", "indigo",
    "lime", "mauve", "mist", "neutral", "olive", "orange", "pink",
    "purple", "red", "rose", "sky", "stone", "taupe", "teal",
    "violet", "yellow", "zinc",
  ];
  for (const e of expected) {
    if (!allThemes[e]) {
      throw new Error(`themes.ts is missing expected accent "${e}"`);
    }
  }

  // Build `accents`: default = null (no rules), then the 7 base names with
  // just the 11 override keys, then the 17 named accents (already overrides
  // only in the source).
  const accents = { default: null };
  for (const name of BASE_NAMES) {
    accents[name] = {
      label: titleCase(name),
      light: pickAccentKeys(bases[name].light),
      dark: pickAccentKeys(bases[name].dark),
    };
  }
  for (const name of expected) {
    if (BASE_NAMES.includes(name)) continue; // already added above
    accents[name] = {
      label: allThemes[name].label,
      light: pickAccentKeys(allThemes[name].light),
      dark: pickAccentKeys(allThemes[name].dark),
    };
  }

  const data = { bases, accents };
  await writeFile(OUT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`→ Wrote ${OUT_PATH}`);
  console.log(
    `  bases:  ${Object.keys(bases).length} (each ${Object.keys(bases.neutral.light).length} tokens × 2 modes)`,
  );
  console.log(
    `  accents: ${Object.keys(accents).length} (default + 24; each non-default has up to ${ACCENT_KEYS.length} override keys × 2 modes)`,
  );
  console.log(
    `  accent override keys (${ACCENT_KEYS.length}): ${ACCENT_KEYS.join(", ")}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
