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
 * The theme lives here too, but localStorage remains the *device-local
 * override* for it: the no-FOUC `<head>` script must read the theme
 * synchronously *before first paint*, and a database round-trip cannot do
 * that. The DB copy is the account-wide default (applied by the server, so
 * a new device starts on the right theme); the localStorage copy is what the
 * user last chose on this device.
 */
export const settings = pgTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  // Theme — the v3 shape: base + accent + chart + mode preference.
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
