import { neon } from "@neondatabase/serverless";

// The dictionary database — a SECOND Neon instance.
//
// The app's own data (users, settings) lives in `DATABASE_URL`, on the shared
// Postgres. The Chinese dictionary tables live in their own database, so this
// is a separate client with its own connection string.
//
// **Server-only.** Never import this from a client component — it pulls the
// database URL into the browser bundle. Use it from route handlers, server
// actions and server components only.
//
// Why raw SQL and not Drizzle: `drizzle.config.ts` points at the APP's
// database. If these tables were modelled in `lib/db/schema/`, a
// `drizzle-kit generate` would emit a migration creating them in the wrong
// database. So the dictionary is deliberately outside the Drizzle schema —
// see `db/dictionary/0001_move_to_public_and_index.sql`.

let cached: ReturnType<typeof neon> | null = null;

export function getDictionaryDb(): ReturnType<typeof neon> {
  if (cached) return cached;

  const url = process.env.DICTIONARY_DATABASE_URL;
  if (!url) {
    throw new Error(
      "DICTIONARY_DATABASE_URL is not set. Add it to .env.local — see AGENTS.md §5 Database.",
    );
  }

  cached = neon(url);
  return cached;
}
