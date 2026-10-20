-- The Chinese dictionary database — migration 0001
--
-- This database is NOT the app's database. The app's own data (users,
-- settings) lives in `DATABASE_URL` on the shared Postgres; the dictionary
-- lives in its own instance, reached through `lib/dictionary/client.ts`.
--
-- This file is the record of what was applied to the dictionary database. It
-- is deliberately NOT in `db/migrations/` — that folder is drizzle-kit's
-- territory for the app's own database, and these tables sit outside the
-- Drizzle schema on purpose (see `lib/dictionary/queries.ts`).
--
-- Applied: 2026-10-20.

-- ---------------------------------------------------------------------------
-- 1. Clear the leftover public tables.
--
-- These were the pre-move Life Hub app's own `users` + `settings`, left in
-- this database when the app moved to the shared Postgres. The live rows
-- live in the app's shared database — these were a stale copy (the theme
-- accent had already drifted), so nothing was lost.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public."settings";
DROP TABLE IF EXISTS public."users";

-- ---------------------------------------------------------------------------
-- 2. Move the `chinese-hub` tables into `public`.
--
-- `ALTER TABLE ... SET SCHEMA` is a catalog-only operation: no data is
-- copied and no table is rewritten. Indexes, constraints and the sequences
-- owned by the columns follow the table automatically, and the foreign keys
-- (by OID) stay valid.
--
-- `hsk-lessons` and `chinese-hub` contain a hyphen, so they must be quoted.
-- ---------------------------------------------------------------------------

ALTER TABLE "chinese-hub".radicals SET SCHEMA public;
ALTER TABLE "chinese-hub".words SET SCHEMA public;
ALTER TABLE "chinese-hub".forms SET SCHEMA public;
ALTER TABLE "chinese-hub".dictionary SET SCHEMA public;
ALTER TABLE "chinese-hub".drawing SET SCHEMA public;
ALTER TABLE "chinese-hub"."hsk-lessons" SET SCHEMA public;
ALTER TABLE "chinese-hub".chinese_sentences SET SCHEMA public;

-- The enum used by `words.pos`.
ALTER TYPE "chinese-hub".pos_code SET SCHEMA public;

-- No CASCADE on purpose: it must fail loudly if anything was left behind.
DROP SCHEMA "chinese-hub";

-- ---------------------------------------------------------------------------
-- 3. The indexes the search needs.
--
-- The query in `lib/dictionary/queries.ts` normalises the pinyin columns the
-- same way, so "ni hao", "nihao" and "ni3hao3" all match 你好. The
-- expressions below MUST stay byte-identical to the ones in the query, or
-- Postgres silently stops using these indexes and falls back to a full scan
-- of 125k rows.
--
-- `array_to_string` is only STABLE, so the meanings index needs an IMMUTABLE
-- wrapper — the query uses the wrapper too.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_dictionary_pinyin_plain_trgm
  ON public.dictionary USING gin (
    regexp_replace(
      translate(lower(pinyin), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü',
                       'aaaaeeeeiiiioooouuuuuvvvv'),
      '[^a-z]', '', 'g') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_dictionary_pinyin_numeric_plain_trgm
  ON public.dictionary USING gin (
    regexp_replace(lower(pinyin_numeric), '[^a-z]', '', 'g') gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.immutable_array_to_string(arr text[], sep text)
  RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  $fn$ SELECT array_to_string(arr, sep) $fn$;

CREATE INDEX IF NOT EXISTS idx_dictionary_meanings_trgm
  ON public.dictionary USING gin (immutable_array_to_string(meanings, ' ') gin_trgm_ops);
