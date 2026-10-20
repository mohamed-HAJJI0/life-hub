import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// A real Postgres, in process. PGlite runs Postgres compiled to WASM, so the
// query builder in `lib/dictionary/queries.ts` runs against the real engine
// — no Docker, no second Neon instance, no network.
//
// The production dictionary has 125,271 rows. We do NOT load it. A ~12 row
// fixture is enough to prove the query is correct and that the index
// expressions are still indexable.

const { pgliteRef } = vi.hoisted(() => ({
  pgliteRef: { current: null as PGlite | null },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/dictionary/client", () => ({
  getDictionaryDb: () => pgliteRef.current,
}));

import { PGlite } from "@electric-sql/pglite";
import { CJK_FIRST, searchDictionary } from "@/lib/dictionary/queries";

type Row = {
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinNumeric: string;
  meanings: string[];
};

/** The fixture. Deliberately small, and deliberately mixed: Chinese
 *  characters, single syllables, multi-syllable words and latin/number
 *  entries that must sort AFTER the Chinese ones. */
const FIXTURE: Row[] = [
  { simplified: "你好", traditional: "你好", pinyin: "nǐ hǎo", pinyinNumeric: "ni3 hao3", meanings: ["hello", "hi"] },
  { simplified: "谢谢", traditional: "謝謝", pinyin: "xièxie", pinyinNumeric: "xie4 xie4", meanings: ["thank you"] },
  { simplified: "是", traditional: "是", pinyin: "shì", pinyinNumeric: "shi4", meanings: ["is", "yes"] },
  { simplified: "十", traditional: "十", pinyin: "shí", pinyinNumeric: "shi2", meanings: ["ten"] },
  { simplified: "时", traditional: "時", pinyin: "shí", pinyinNumeric: "shi2", meanings: ["time", "hour"] },
  { simplified: "十二", traditional: "十二", pinyin: "shí'èr", pinyinNumeric: "shi2 er4", meanings: ["twelve"] },
  { simplified: "时候", traditional: "時候", pinyin: "shíhou", pinyinNumeric: "shi2 hou5", meanings: ["time", "moment"] },
  { simplified: "中", traditional: "中", pinyin: "zhōng", pinyinNumeric: "zhong1", meanings: ["middle", "centre"] },
  { simplified: "好", traditional: "好", pinyin: "hǎo", pinyinNumeric: "hao3", meanings: ["good"] },
  { simplified: "绿", traditional: "綠", pinyin: "lǜ", pinyinNumeric: "lv4", meanings: ["green"] },
  { simplified: "110", traditional: "110", pinyin: "yī yī líng", pinyinNumeric: "yi1 yi1 ling2", meanings: ["one hundred ten"] },
  { simplified: "119", traditional: "119", pinyin: "yī yī jiǔ", pinyinNumeric: "yi1 yi1 jiu3", meanings: ["emergency number"] },
];

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

let db: PGlite;

beforeAll(async () => {
  db = await PGlite.create();
  pgliteRef.current = db;

  await db.exec(`
    create table public.dictionary (
      id serial primary key,
      simplified text not null,
      traditional text not null,
      pinyin text,
      pinyin_numeric text not null,
      meanings text[] not null default '{}'
    );
  `);

  // The IMMUTABLE wrapper the meanings index needs — `array_to_string` is
  // only STABLE, so Postgres refuses to index it directly.
  await db.exec(`
    create or replace function public.immutable_array_to_string(arr text[], sep text)
      returns text language sql immutable parallel safe as
      $fn$ select array_to_string(arr, sep) $fn$;
  `);

  for (const row of FIXTURE) {
    await db.exec(
      `insert into public.dictionary
         (simplified, traditional, pinyin, pinyin_numeric, meanings)
       values (${quote(row.simplified)}, ${quote(row.traditional)}, ${quote(row.pinyin)},
               ${quote(row.pinyinNumeric)}, array[${row.meanings.map(quote).join(", ")}]);`,
    );
  }
}, 120_000);

afterAll(async () => {
  if (db) await db.close();
});

describe("the dictionary index expressions", () => {
  it("the CJK-first expression can still carry an index", async () => {
    // Postgres only indexes IMMUTABLE expressions. If this expression ever
    // becomes STABLE, the index silently stops being used and the browse
    // sorts 125k rows per page — so the index has to still be creatable.
    await expect(
      db.exec(
        `create index idx_dictionary_cjk_first
           on public.dictionary ((${CJK_FIRST}) desc, id);`,
      ),
    ).resolves.toBeDefined();
  });

  it("the pinyin normalisation expression can still carry an index", async () => {
    await expect(
      db.exec(`
        create index idx_dictionary_pinyin_plain
          on public.dictionary ((
            regexp_replace(
              translate(lower(pinyin), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü',
                               'aaaaeeeeiiiioooouuuuuvvvv'),
              '[^a-z]', '', 'g')));
      `),
    ).resolves.toBeDefined();
  });
});

describe("searchDictionary — a Chinese query", () => {
  it("finds the entry by its character", async () => {
    const page = await searchDictionary({ query: "你好", offset: 0 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].simplified).toBe("你好");
    expect(page.items[0].meanings).toEqual(["hello", "hi"]);
  });

  it("finds the traditional form too", async () => {
    const page = await searchDictionary({ query: "時", offset: 0 });

    expect(page.items.map((i) => i.simplified)).toContain("时");
  });
});

describe("searchDictionary — a pinyin query", () => {
  it("matches across the tone marks, the spaces and the tone numbers", async () => {
    for (const query of ["ni hao", "nihao", "ni3hao3", "NI HAO", "nǐ hǎo"]) {
      const page = await searchDictionary({ query, offset: 0 });
      expect(page.items[0]?.simplified, `query "${query}"`).toBe("你好");
    }
  });

  it("matches the `lü` entry, where the SQL deletes the `ü`", async () => {
    // `translate(..., '…ü', '…')` has no target character for `ü`, so
    // Postgres DELETES it — "lü" normalises to "l", "lǜ" to "lv".
    const page = await searchDictionary({ query: "lv", offset: 0 });

    expect(page.items.map((i) => i.simplified)).toContain("绿");
  });

  it("ranks the plain single syllable before the multi-syllable words", async () => {
    const page = await searchDictionary({ query: "shi", offset: 0 });

    // 是 / 十 / 时 come before 十二 / 时候.
    const first = page.items[0]?.simplified;
    expect(["是", "十", "时"]).toContain(first);
    const later = page.items.map((i) => i.simplified);
    expect(later.indexOf("十二")).toBeGreaterThan(later.indexOf(first as string));
  });
});

describe("searchDictionary — a meaning query", () => {
  it("finds an entry by its English meaning", async () => {
    const page = await searchDictionary({ query: "thank", offset: 0 });

    expect(page.items.map((i) => i.simplified)).toContain("谢谢");
  });
});

describe("searchDictionary — browsing", () => {
  it("puts the Chinese characters first", async () => {
    const page = await searchDictionary({ query: "", offset: 0 });

    // The numeric entries ("110", "119") must sort after the Chinese ones.
    const first = page.items[0]?.simplified ?? "";
    expect(Number(first)).toBeNaN();
  });

  it("pages without repeating or dropping rows", async () => {
    const first = await searchDictionary({ query: "", offset: 0, limit: 5 });
    const second = await searchDictionary({ query: "", offset: 5, limit: 5 });

    expect(first.items).toHaveLength(5);
    expect(first.hasMore).toBe(true);
    expect(second.items).toHaveLength(5);

    const firstIds = first.items.map((i) => i.id);
    const secondIds = second.items.map((i) => i.id);
    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
  });

  it("reports the end of the list", async () => {
    const page = await searchDictionary({ query: "", offset: 100, limit: 5 });

    expect(page.items).toHaveLength(0);
    expect(page.hasMore).toBe(false);
  });

  it("clamps a negative offset to zero", async () => {
    const page = await searchDictionary({ query: "", offset: -10, limit: 3 });

    expect(page.offset).toBe(0);
    expect(page.items).toHaveLength(3);
  });
});
