import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Drizzle Kit runs as a standalone Node process — it does NOT get Next.js's
// automatic `.env.local` loading. Neon lives behind `DATABASE_URL` in
// `.env.local`, so we load it explicitly. `.env.local` first; `.env` as a
// fallback (dotenv never overwrites an already-set variable).
config({ path: fileURLToPath(new URL(".env.local", import.meta.url)) });
config({ path: fileURLToPath(new URL(".env", import.meta.url)) });

export default defineConfig({
  dialect: "postgresql",
  // Every table in the app. `lib/db/schema/index.ts` re-exports the
  // per-module schema files so this is the single entry point.
  schema: "./lib/db/schema/index.ts",
  // Migrations are tracked in git: `db/migrations/NNNN_<name>.sql` + meta/.
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
