-- The Chinese dictionary database — migration 0002
--
-- The browse list should open with the Chinese characters, not with the
-- entries that begin with a digit ("110", "119", "2019冠状病毒病", …).
--
-- The ordering key is "does the entry start with a Chinese character", and
-- it has to be an INDEXED expression. Postgres only indexes IMMUTABLE
-- expressions, and both of the obvious ways to write this are not:
--
--   simplified >= '一'   → a text comparison depends on the collation → STABLE
--   convert_to(...)     → STABLE as well (the source encoding is a
--                          database-level constant)
--
-- `ascii()` returns the Unicode code point of the first character, and it
-- is IMMUTABLE, as is `substring()`. So the key is built from those:
--
--   19968 = U+4E00 (一)      the first code point of the CJK block
--   40960 = one past U+9FFF (鿿)
--
-- The expression MUST stay byte-identical to `CJK_FIRST` in
-- `lib/dictionary/queries.ts` — if they drift, Postgres silently stops
-- using this index and the browse sorts 125k rows per page.
--
-- Applied: 2026-10-20. 124,704 of the 125,271 entries start with a Chinese
-- character; the remaining 567 (numbers, latin) sort after them.

CREATE INDEX IF NOT EXISTS idx_dictionary_cjk_first
  ON public.dictionary (
    ((ascii(substring(simplified from 1 for 1)) >= 19968 and ascii(substring(simplified from 1 for 1)) < 40960)::int) DESC,
    id
  );
