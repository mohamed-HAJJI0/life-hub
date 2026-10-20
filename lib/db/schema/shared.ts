import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Shared tables — used by every module in every app.
//
// Per-module tables live in their own file next to this one
// (`chinese.ts`, …) and are prefixed by module name
// (`chinese_characters`, `chinese_reviews`, …).

/**
 * The spine of the app. The Clerk user id IS the primary key — no separate
 * internal id, no mapping table. Clerk owns the identity; we just mirror the
 * bits we need (email, display name) so the rest of the app can query
 * without reaching into Clerk on every read.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * DB-backed user preferences, 1:1 with `users`.
 *
 * Note what is NOT here: the theme. The theme lives in localStorage because
 * the no-FOUC `<head>` script must read it synchronously *before first paint*
 * — a database round-trip cannot do that. Theme is a device preference;
 * language and timezone are account preferences and follow the user.
 */
export const settings = pgTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
