import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TABLES } from "@/lib/db/tables";

// Every table name lives in `lib/db/tables.ts`. Change it there and the
// schema, the queries and the next migration all follow — there is no
// second place to remember.
//
// This test makes sure nobody hard-codes a table name in a query, because
// that is exactly the mistake the convention exists to prevent.

const ROOT = resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "tests") {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const SOURCE_FILES = [
  ...walk(join(ROOT, "lib")),
  ...walk(join(ROOT, "app")),
  ...walk(join(ROOT, "components")),
];

describe("lib/db/tables.ts", () => {
  it("is the only place a table name is written out", () => {
    const offenders: string[] = [];

    for (const file of SOURCE_FILES) {
      // The registry itself is allowed to spell the names out.
      if (relative(ROOT, file) === join("lib", "db", "tables.ts")) continue;

      const source = readFileSync(file, "utf8");
      for (const name of Object.values(TABLES)) {
        // A quoted, exact table name — not "users_auth_id_unique" and not
        // the word "users" in a comment.
        if (source.includes(`"${name}"`) || source.includes(`'${name}'`)) {
          offenders.push(`${relative(ROOT, file)} hard-codes "${name}"`);
        }
      }
    }

    expect(offenders, "use TABLES from lib/db/tables.ts instead").toEqual([]);
  });

  it("lists the tables Life Hub owns", () => {
    expect(TABLES.users).toBe("users");
    expect(TABLES.settings).toBe("settings");
  });
});
