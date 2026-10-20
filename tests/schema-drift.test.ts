import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The `users` table belongs to ANOTHER app that shares our database. The
// Drizzle model mirrors that table exactly — every column, including the
// other app's `name`, `student_id`, `password_hashed` and `roles`.
//
// If the model drifts from the real table, the next generated migration
// emits SQL that destroys the other app's data. This test makes sure there
// is no drift: it runs `drizzle-kit generate` against a COPY of the
// migration folder and fails if a new migration appears.
//
// The real `db/migrations/` is never touched — the copy is what gets
// written to.

const ROOT = resolve(__dirname, "..");
const MIGRATIONS = join(ROOT, "db", "migrations");
const SCHEMA = join(ROOT, "lib", "db", "schema", "index.ts").replace(
  /\\/g,
  "/",
);
const DRIZZLE_BIN = join(ROOT, "node_modules", "drizzle-kit", "bin.cjs");

// The throw-away config lives INSIDE the project: drizzle-kit's schema
// loader resolves the schema file's own imports (`drizzle-orm`) relative to
// the config's folder, so a config in the OS temp dir cannot load it.
const CONFIG_PATH = join(ROOT, ".drizzle-drift.config.ts");

let workDir: string;
let outDir: string;

/** Read one variable out of `.env.local` (the test's cwd is the project). */
function envLocal(name: string): string | undefined {
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][\w]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (match?.[1] === name) {
        return match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — the dummy URL below is enough for `generate`, which
    // never opens a connection.
  }
  return undefined;
}

beforeAll(() => {
  // drizzle-kit resolves `out` against the process cwd, so the working
  // directory is a throw-away folder and `out` is a folder inside it.
  workDir = mkdtempSync(join(tmpdir(), "life-hub-drift-"));
  outDir = join(workDir, "migrations");

  // Copy the whole migrations folder, meta/ included — drizzle-kit diffs the
  // schema against the LAST SNAPSHOT, so without the snapshots it would
  // generate a fresh baseline instead of reporting the drift.
  cpSync(MIGRATIONS, outDir, { recursive: true });

  // A config of its own, because `drizzle-kit generate` refuses to mix
  // `--config` with other CLI flags — the config has to carry `out`.
  //
  // `out` is relative to the process cwd (the project root).
  writeFileSync(
    CONFIG_PATH,
    `export default {
  dialect: "postgresql",
  schema: ${JSON.stringify(SCHEMA)},
  out: ${JSON.stringify(relative(ROOT, outDir))},
  dbCredentials: {
    url: ${JSON.stringify(
      envLocal("DATABASE_URL") ?? "postgresql://user:pass@localhost:5432/db",
    )},
  },
  strict: true,
  verbose: true,
};
`,
    "utf8",
  );
}, 120_000);

afterAll(() => {
  if (workDir) rmSync(workDir, { recursive: true, force: true });
  rmSync(CONFIG_PATH, { force: true });
});

describe("the Drizzle schema", () => {
  it(
    "has not drifted from the last migration",
    () => {
      const before = readdirSync(outDir).filter((f) => f.endsWith(".sql"));

      // Call drizzle-kit's bin script through node directly — spawning a
      // `.cmd` shim needs `shell: true` on modern Node.
      try {
        execFileSync(
          process.execPath,
          [DRIZZLE_BIN, "generate", "--config", CONFIG_PATH],
          { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        );
      } catch (error) {
        const failure = error as { stdout?: string; stderr?: string };
        throw new Error(
          `drizzle-kit generate failed:\n${failure.stdout ?? ""}\n${failure.stderr ?? ""}`,
        );
      }

      const after = readdirSync(outDir).filter((f) => f.endsWith(".sql"));

      expect(
        after,
        "drizzle-kit wanted to write a new migration — the schema and db/migrations/ have drifted",
      ).toEqual(before);
    },
    180_000,
  );
});
