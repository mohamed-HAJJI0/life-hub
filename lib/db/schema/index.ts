// Single entry point for the whole schema. `drizzle.config.ts` points
// `schema` here, and `lib/db/client.ts` passes this to Drizzle so
// `db.query.*` relations work.
//
// Per-module schema files are re-exported here as they are added:
//   export * from "./chinese";
export * from "./shared";
