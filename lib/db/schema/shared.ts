import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { TABLES } from "../tables";

// Shared tables — the ones more than one app may touch.
//
// The database also serves another application, so this schema describes
// only what Life Hub owns. Everything else in `public` (courses, posts,
// submissions, accepted-ids) is left alone: it is not modelled here, which
// is what stops `drizzle-kit` from ever proposing to drop it.
//
// The `users` table is that other app's table, extended by us. The model
// below mirrors its real shape EXACTLY — if it drifts, a generated
// migration would emit SQL that destroys the other app's data.

/**
 * The `roles` enum, shared with the other app. It already exists in the
 * database; declaring it here keeps the column type honest (modelling it
 * as plain text would make Drizzle want to convert the column).
 */
export const roles = pgEnum("roles", ["admin", "student", "owner"]);

/**
 * Users — shared with the other app, so it was not created by Drizzle and
 * its primary key is that app's surrogate uuid, not our auth id.
 *
 * `auth_id` is the column Life Hub adds: the Clerk user id this row
 * belongs to. It is NULL for rows that have never signed in to Life Hub.
 * Everything else on the table belongs to the other app and is modelled
 * here only so that a generated migration can never propose dropping it.
 *
 * Note: the table also carries a UNIQUE index on `lower(email)`. A
 * functional index cannot be expressed in Drizzle, so it is not modelled
 * here — and it is safe, because migrations only ever run the SQL they
 * contain, so it is never dropped.
 */
export const users = pgTable(
  TABLES.users,
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    studentId: text("student_id"),
    passwordHashed: text("password_hashed"),
    hashingSalt: text("hashing-salt"),
    roles: roles("roles").notNull().default("student"),
    email: text("email"),
    /** The Clerk account this row belongs to. */
    authId: text("auth_id"),
  },
  (t) => [uniqueIndex("users_auth_id_unique").on(t.authId)],
);

/**
 * Settings — ours. One row per signed-in user, keyed by the Clerk id
 * (`users.auth_id`), holding language, timezone and the theme.
 *
 * The foreign key points at `users.auth_id` rather than `users.id` so the
 * app can look a user's settings up with the Clerk id it already has, with
 * no extra round trip.
 */
export const settings = pgTable(TABLES.settings, {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.authId, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  themeBase: text("theme_base").notNull().default("neutral"),
  themeAccent: text("theme_accent").notNull().default("default"),
  themeChart: text("theme_chart").notNull().default("default"),
  themeMode: text("theme_mode").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
