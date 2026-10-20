import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import {
  CJK_FIRST,
  MEANINGS_TEXT,
  NORMALISED_PINYIN,
  NORMALISED_PINYIN_NUMERIC,
} from "@/lib/dictionary/queries";

// THE most important test in this suite.
//
// The dictionary's search indexes are built on *expressions*, and the query
// has to use the very same expressions to use those indexes. If the two
// drift apart, Postgres does not complain — it silently stops using the
// index and falls back to a full scan of 125,271 rows on every search.
//
// Both files say so in a comment; this test makes it true.

const ROOT = resolve(__dirname, "..");

const SQL_0001 = readFileSync(
  resolve(ROOT, "db/dictionary/0001_move_to_public_and_index.sql"),
  "utf8",
);
const SQL_0002 = readFileSync(
  resolve(ROOT, "db/dictionary/0002_cjk_first_index.sql"),
  "utf8",
);

/**
 * Remove the whitespace that is OUTSIDE a string literal.
 *
 * The SQL file wraps the pinyin expression over several lines; the query
 * keeps it on one. Inside a literal ('…') the whitespace is part of the
 * value and must survive — `immutable_array_to_string(meanings, ' ')` uses a
 * single space as its separator.
 */
function stripWhitespaceOutsideQuotes(sql: string): string {
  let out = "";
  let inQuote = false;

  for (const ch of sql) {
    if (ch === "'") {
      inQuote = !inQuote;
      out += ch;
      continue;
    }
    if (!inQuote && /\s/.test(ch)) continue;
    out += ch;
  }

  return out;
}

/** Compare two SQL fragments ignoring layout differences. */
function sameSql(a: string, b: string): boolean {
  return (
    stripWhitespaceOutsideQuotes(a.normalize("NFC")) ===
    stripWhitespaceOutsideQuotes(b.normalize("NFC"))
  );
}

describe("the dictionary index expressions", () => {
  it("the pinyin expression matches the one the index is built on", () => {
    const inSql = stripWhitespaceOutsideQuotes(SQL_0001.normalize("NFC"));
    const inQuery = stripWhitespaceOutsideQuotes(NORMALISED_PINYIN.normalize("NFC"));

    expect(inSql).toContain(inQuery);
  });

  it("the numeric pinyin expression matches the index", () => {
    expect(SQL_0001).toContain(NORMALISED_PINYIN_NUMERIC);
  });

  it("the meanings expression matches the index", () => {
    expect(SQL_0001).toContain(MEANINGS_TEXT);
  });

  it("the CJK-first ordering expression matches its index", () => {
    expect(SQL_0002).toContain(CJK_FIRST);
  });

  it("the expressions are the same modulo layout", () => {
    // A belt-and-braces pass: pull each expression out of the SQL file and
    // compare it to the query's constant with whitespace normalised away.
    const pinyinInSql = SQL_0001.match(
      /regexp_replace\(\s*translate\(lower\(pinyin\)[\s\S]*?\)\s*,\s*'\[\^a-z\]',\s*'',\s*'g'\)/,
    )?.[0];

    expect(pinyinInSql, "the pinyin expression in the SQL file").toBeDefined();
    expect(sameSql(pinyinInSql as string, NORMALISED_PINYIN)).toBe(true);
  });
});

describe("the query's own expressions", () => {
  it("normalises the tone marks the same way the SQL does", () => {
    // The diacritic list and its plain-form mapping are the heart of the
    // contract: `ü` has no target character, so Postgres DELETES it.
    expect(NORMALISED_PINYIN).toContain("'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'");
    expect(NORMALISED_PINYIN).toContain("'aaaaeeeeiiiioooouuuuuvvvv'");
  });

  it("uses the IMMUTABLE wrapper for the meanings index", () => {
    // `array_to_string` is only STABLE, so the database has an IMMUTABLE
    // wrapper — and the query has to use the wrapper too, or the index
    // cannot be used.
    expect(MEANINGS_TEXT).toBe("immutable_array_to_string(meanings, ' ')");
  });

  it("orders the browse list with the CJK-first expression", () => {
    expect(CJK_FIRST).toContain("ascii(substring(simplified from 1 for 1))");
    expect(CJK_FIRST).toContain("19968");
    expect(CJK_FIRST).toContain("40960");
  });
});
