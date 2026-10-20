import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/messages/en.json";
import { getDictionary } from "@/lib/i18n";

const ROOT = resolve(__dirname, "..");

// A translation gap is invisible in code review and obvious in the UI: `t()`
// renders a missing key as the key itself, so a half-finished locale shows
// up as raw dotted text on the page.
//
// Two guards:
//   1. every locale has the same keys as English, and
//   2. every key the source actually asks for exists.

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "tests") {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Every `t(<dict>, "some.key")` literal in the app source. */
function literalKeys(): string[] {
  const files = [
    ...walk(join(ROOT, "app")),
    ...walk(join(ROOT, "components")),
    ...walk(join(ROOT, "lib")),
  ];

  const keys = new Set<string>();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const pattern = /\bt\(\s*[A-Za-z_$][\w$]*\s*,\s*["']([^"']+)["']\s*\)/g;
    for (const match of source.matchAll(pattern)) {
      keys.add(match[1]);
    }
  }
  return [...keys].sort();
}

describe("the translation files", () => {
  it("have the same keys in every locale", () => {
    const enKeys = Object.keys(en).sort();
    const zhKeys = Object.keys(getDictionary("zh")).sort();

    expect(zhKeys).toEqual(enKeys);
  });

  it("have no empty translations", () => {
    for (const [locale, dict] of [
      ["en", en],
      ["zh", getDictionary("zh")],
    ] as const) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });
});

describe("the keys the source asks for", () => {
  it("all exist in the dictionary", () => {
    const dict = getDictionary("en");
    const missing = literalKeys().filter((key) => !(key in dict));

    expect(missing, "keys used in the code but missing from en.json").toEqual([]);
  });
});
