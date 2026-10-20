-- The Chinese dictionary database — migration 0002
--
-- The browse list should open with the Chinese characters, not with the
-- entries that begin with a digit ("110", "119", "2019冠状病毒病", …).
--
-- The ordering key is "does the entry start with a Chinese character", and
-- it has to be an INDEXED expression: a plain text comparison depends on
-- the collation, which makes it STABLE, and Postgres refuses to index a
-- STABLE expression. Going through `convert_to` and comparing the UTF-8
-- bytes is IMMUTABLE, so it can carry an index.
--
-- The expression MUST stay byte-identical to `CJK_FIRST` in
-- `lib/dictionary/queries.ts` — if they drift, Postgres silently stops
-- using this index and the browse falls back to sorting 125k rows per
-- page.
--
-- Applied: 2026-10-20.

CREATE INDEX IF NOT EXISTS idx_dictionary_cjk_first
  ON public.dictionary (
    ((convert_to(substring(simplified from 1 for 1), 'UTF8') >= convert_to('一', 'UTF8')
      and convert_to(substring(simplified from 1 for 1), 'UTF8') < convert_to('鿿', 'UTF8'))::int) DESC,
    id
  );
