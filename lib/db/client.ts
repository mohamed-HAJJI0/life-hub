import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | null = null;

/**
 * The Drizzle client for Neon Postgres.
 *
 * **Server-only.** Never import this from a client component — it pulls in
 * the database URL and would end up in the browser bundle. Use it from
 * server components, server actions, and `lib/` service modules.
 *
 * The client is created lazily on first use so that merely importing this
 * module never throws (e.g. during a build where no query is actually run).
 *
 * We use the Neon HTTP driver rather than a WebSocket/TCP connection: it
 * works in serverless environments where you cannot hold a socket open, and
 * it does not need a connection pool on our side. Point `DATABASE_URL` at
 * Neon's **pooled** endpoint.
 */
export function getDb(): Database {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local — see AGENTS.md §5 Database.",
    );
  }

  cached = drizzle(neon(url), { schema });
  return cached;
}
