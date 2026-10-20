// Every table name the app owns, in one place.
//
// Change a name here and the schema, the queries and the next generated
// migration all follow — there is no second place to remember.
//
// Only the tables Life Hub manages live here. The database is shared with
// another app, and its other tables (courses, posts, submissions, …) are
// deliberately not modelled: we never read, write or migrate them, and
// leaving them out of the schema is what keeps `drizzle-kit` from ever
// proposing to drop them.

export const TABLES = {
  /** Shared with another app — extended by us, not created by us. */
  users: "users",
  /** Ours. One row per signed-in user. */
  settings: "settings",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
