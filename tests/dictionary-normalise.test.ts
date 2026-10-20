import { describe, expect, it, vi } from "vitest";

// `lib/dictionary/queries.ts` pulls in Next's cache API, which only exists
// inside a Next runtime. The dictionary helpers under test never touch it.
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import {
  DICTIONARY_PAGE_SIZE,
  isChineseQuery,
  normaliseQuery,
} from "@/lib/dictionary/queries";

// The JS normaliser must mirror the SQL `translate()` in
// `db/dictionary/0001_move_to_public_and_index.sql` exactly — including the
// quirk that Postgres DELETES a `ü` because it has no target character.

describe("normaliseQuery", () => {
  it("drops the spaces between syllables", () => {
    expect(normaliseQuery("ni hao")).toBe("nihao");
    expect(normaliseQuery("nihao")).toBe("nihao");
  });

  it("drops the tone numbers", () => {
    expect(normaliseQuery("NI3HAO3")).toBe("nihao");
    expect(normaliseQuery("ni3hao3")).toBe("nihao");
  });

  it("strips the tone marks", () => {
    expect(normaliseQuery("nǐ hǎo")).toBe("nihao");
    expect(normaliseQuery("shí")).toBe("shi");
  });

  it("lowercases", () => {
    expect(normaliseQuery("Hello")).toBe("hello");
  });

  it("turns `ü` into `v`", () => {
    expect(normaliseQuery("lǘ")).toBe("lv");
    expect(normaliseQuery("lǚ")).toBe("lv");
    expect(normaliseQuery("lǜ")).toBe("lv");
  });

  it("DELETES a bare `ü`, because the SQL translate() has no target for it", () => {
    // `translate('lü', '…ü', '…')` removes the `ü` entirely — it is not
    // mapped to "v". The JS mirror has to drop it too, or the two disagree
    // and the search silently misses rows.
    expect(normaliseQuery("lü")).toBe("l");
  });

  it("keeps only the letters", () => {
    expect(normaliseQuery("!!!")).toBe("");
    expect(normaliseQuery("   ")).toBe("");
    expect(normaliseQuery("a1b2")).toBe("ab");
  });
});

describe("isChineseQuery", () => {
  it("detects Chinese characters", () => {
    expect(isChineseQuery("你好")).toBe(true);
    expect(isChineseQuery("学")).toBe(true);
  });

  it("does not treat latin or digits as Chinese", () => {
    expect(isChineseQuery("hello")).toBe(false);
    expect(isChineseQuery("ni hao")).toBe(false);
    expect(isChineseQuery("123")).toBe(false);
    expect(isChineseQuery("")).toBe(false);
  });
});

describe("DICTIONARY_PAGE_SIZE", () => {
  it("is the page size the browser fetches", () => {
    expect(DICTIONARY_PAGE_SIZE).toBe(100);
  });
});
