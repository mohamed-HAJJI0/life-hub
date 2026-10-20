import { getDictionaryDb } from "./client";

// The Chinese dictionary — 125,271 entries in the `public.dictionary` table of
// the dictionary database (see `lib/dictionary/client.ts`).
//
// Two search shapes, chosen by what the user typed:
//
//   CJK input  -> `simplified` / `traditional` prefix match. Indexed, ~0.4 ms.
//
//   latin input-> toneless pinyin match on BOTH pinyin columns, plus the
//                 English meaning. The pinyin columns are matched through
//                 normalised expressions so that "ni hao", "nihao" and
//                 "ni3hao3" all find 你好.
//
// The normalised expressions below MUST match the index expressions in
// `db/dictionary/0001_move_to_public_and_index.sql` byte for byte — if they
// drift, Postgres silently stops using the trigram indexes and the search
// falls back to a full scan of 125k rows.

export type DictionaryEntry = {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string | null;
  pinyinNumeric: string;
  meanings: string[];
};

export type DictionaryPage = {
  items: DictionaryEntry[];
  offset: number;
  limit: number;
  hasMore: boolean;
  query: string;
};

/** How many rows one page holds. */
export const DICTIONARY_PAGE_SIZE = 100;

/**
 * The diacritics stripped by the SQL `translate()`, and their plain forms.
 *
 * Note the last one: `ü` has no target character, so Postgres' `translate()`
 * DELETES it — `lü` normalises to `l`, while `lǜ` normalises to `lv`. The
 * JS normaliser below mirrors that exactly.
 */
const DIACRITICS = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü";
const PLAIN = "aaaaeeeeiiiioooouuuuuvvvv";

/** `lower(pinyin)` with the tone marks removed and the letters kept. */
export const NORMALISED_PINYIN = `regexp_replace(translate(lower(pinyin), '${DIACRITICS}', '${PLAIN}'), '[^a-z]', '', 'g')`;

/** `lower(pinyin_numeric)` with the tone numbers and spaces removed. */
export const NORMALISED_PINYIN_NUMERIC = `regexp_replace(lower(pinyin_numeric), '[^a-z]', '', 'g')`;

/**
 * The meanings array as one searchable string.
 *
 * `array_to_string` is only STABLE, so the database has an IMMUTABLE wrapper
 * for it (`immutable_array_to_string`) — the index is built on the wrapper,
 * so the query has to use the wrapper too.
 */
export const MEANINGS_TEXT = `immutable_array_to_string(meanings, ' ')`;

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

/** Is the query Chinese (or Japanese kanji)? Those search the character columns. */
export function isChineseQuery(query: string): boolean {
  return CJK.test(query);
}

const DIACRITIC_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "v",
  ǘ: "v",
  ǚ: "v",
  ǜ: "v",
  // `ü` is deleted by the SQL `translate()` — it has no target character.
  ü: "",
};

/**
 * Normalise a search term the same way the columns are normalised:
 * lowercase, drop the tone marks, keep only the letters.
 *
 * "ni hao" -> "nihao", "NI3HAO3" -> "nihao", "lǜ" -> "lv".
 */
export function normaliseQuery(raw: string): string {
  let out = "";
  for (const ch of raw.toLowerCase()) {
    const mapped = DIACRITIC_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
    } else if (ch >= "a" && ch <= "z") {
      out += ch;
    }
    // Everything else — spaces, digits, punctuation — is dropped.
  }
  return out;
}

const SELECT_COLUMNS = `id, simplified, traditional, pinyin, pinyin_numeric, meanings`;

type RawRow = {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string | null;
  pinyin_numeric: string;
  meanings: string[] | null;
};

/**
 * Run one query and return its rows.
 *
 * The driver's `query()` has a wide overload set (a single query, an array of
 * queries, …), so its return type is a union — and depending on the version
 * it hands back either the rows array itself or a `{ rows }` envelope. This
 * narrows both to the shape we actually use.
 */
async function runQuery(
  db: ReturnType<typeof getDictionaryDb>,
  text: string,
  params: unknown[],
): Promise<RawRow[]> {
  const result = await db.query(text, params as never[]);
  if (Array.isArray(result)) return result as RawRow[];
  return (result as unknown as { rows?: RawRow[] }).rows ?? [];
}

function toEntry(row: RawRow): DictionaryEntry {
  return {
    id: row.id,
    simplified: row.simplified,
    traditional: row.traditional,
    pinyin: row.pinyin,
    pinyinNumeric: row.pinyin_numeric,
    meanings: row.meanings ?? [],
  };
}

/**
 * One page of the dictionary.
 *
 * `offset` paging over `ORDER BY id` stays cheap even at the end of the
 * table (~38 ms at offset 125,000), which is why the list can page this way.
 */
export async function searchDictionary(params: {
  query: string;
  offset: number;
  limit?: number;
}): Promise<DictionaryPage> {
  const query = params.query.trim();
  const offset = Math.max(0, params.offset);
  const limit = Math.min(500, Math.max(1, params.limit ?? DICTIONARY_PAGE_SIZE));

  const db = getDictionaryDb();

  // One extra row tells us whether there is a next page — no second query.
  const rows = query
    ? await searchRows(db, query, offset, limit + 1)
    : await browseRows(db, offset, limit + 1);

  return {
    items: rows.slice(0, limit).map(toEntry),
    offset,
    limit,
    hasMore: rows.length > limit,
    query,
  };
}

async function browseRows(
  db: ReturnType<typeof getDictionaryDb>,
  offset: number,
  limit: number,
): Promise<RawRow[]> {
  return runQuery(
    db,
    `select ${SELECT_COLUMNS} from public.dictionary order by id limit $1 offset $2`,
    [limit, offset],
  );
}

async function searchRows(
  db: ReturnType<typeof getDictionaryDb>,
  query: string,
  offset: number,
  limit: number,
): Promise<RawRow[]> {
  // Chinese characters: prefix match on both scripts, exact hits first.
  if (isChineseQuery(query)) {
    return runQuery(
      db,
      `select ${SELECT_COLUMNS}
         from public.dictionary
        where simplified like $1 or traditional like $1
        order by (case when simplified = $2 or traditional = $2 then 0 else 1 end), id
        limit $3 offset $4`,
      [`${query}%`, query, limit, offset],
    );
  }

  // Latin input: toneless pinyin on both pinyin columns, plus the meaning.
  const normalised = normaliseQuery(query);

  if (!normalised) {
    // Nothing searchable (e.g. "!!!") — fall back to the meaning only.
    return runQuery(
      db,
      `select ${SELECT_COLUMNS}
         from public.dictionary
        where ${MEANINGS_TEXT} ilike $1
        order by id
        limit $2 offset $3`,
      [`%${query}%`, limit, offset],
    );
  }

  return runQuery(
    db,
    `select ${SELECT_COLUMNS}
       from public.dictionary
      where ${NORMALISED_PINYIN} like $1
         or ${NORMALISED_PINYIN_NUMERIC} like $1
         or ${MEANINGS_TEXT} ilike $2
      order by id
      limit $3 offset $4`,
    [`%${normalised}%`, `%${query}%`, limit, offset],
  );
}
