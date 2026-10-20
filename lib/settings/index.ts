import { cacheLife, cacheTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings, users } from "@/lib/db/schema";

// DB-backed user settings.
//
// The session belongs to Clerk; the *preferences* belong to us. The Clerk
// user id is the key.
//
// Note what is NOT here: the theme. The theme lives in localStorage because
// the no-FOUC `<head>` script must read it synchronously before first paint.
// See `AGENTS.md` §5 Database.

export type UserSettings = {
  language: string;
  timezone: string;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: "en",
  timezone: "UTC",
};

/**
 * Read a user's settings.
 *
 * Cached per user with a tag, so a change can expire exactly this entry
 * (and nobody else's). `revalidateTag` in `actions.ts` does that.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  "use cache";
  cacheTag(`settings:${userId}`);
  cacheLife("hours");

  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return DEFAULT_USER_SETTINGS;

  return { language: row.language, timezone: row.timezone };
}

/**
 * The signed-in user's settings, or the defaults.
 *
 * `auth()` is a dynamic API, so this cannot live inside the cached
 * `getUserSettings` — it resolves the user first, then calls the cached
 * read. Cheap: the second call hits the cache.
 */
export async function getCurrentUserSettings(): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) return DEFAULT_USER_SETTINGS;
  return getUserSettings(userId);
}

/**
 * Create or update the `users` row that mirrors the Clerk account.
 *
 * Called from server actions (never during render — a render can be
 * replayed, and a write cannot).
 */
export async function ensureUser(input: {
  id: string;
  email: string;
  displayName?: string | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(users)
    .values({
      id: input.id,
      email: input.email,
      displayName: input.displayName ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: input.email,
        displayName: input.displayName ?? null,
        updatedAt: now,
      },
    });
}

/** Write one or more settings for a user. */
export async function upsertUserSettings(
  userId: string,
  patch: Partial<UserSettings>,
): Promise<UserSettings> {
  const db = getDb();
  const now = new Date();

  const changed = {
    ...(patch.language !== undefined ? { language: patch.language } : {}),
    ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
  };

  await db
    .insert(settings)
    .values({ userId, ...changed, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { ...changed, updatedAt: now },
    });

  return getUserSettings(userId);
}
