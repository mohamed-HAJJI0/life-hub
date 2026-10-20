"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { isValidTimezone } from "@/lib/time";
import {
  ensureUser,
  upsertUserSettings,
  type UserSettings,
} from "./index";

// Server actions for user settings.
//
// Every action authenticates via Clerk and validates its input — the client
// is not trusted. Writes go through `lib/settings/index.ts`; this file only
// handles the request/response boundary.

/**
 * Save one or more settings for the signed-in user.
 *
 * Creates the `users` + `settings` rows on first save, then expires this
 * user's cached settings so the shell re-renders with the new values.
 */
export async function saveSettingsAction(patch: {
  language?: string;
  timezone?: string;
}): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  const changed: Partial<UserSettings> = {};

  if (patch.language !== undefined) {
    if (!isLocale(patch.language)) {
      throw new Error(`Unsupported language: ${patch.language}`);
    }
    changed.language = patch.language;
  }

  if (patch.timezone !== undefined) {
    if (!isValidTimezone(patch.timezone)) {
      throw new Error(`Unsupported timezone: ${patch.timezone}`);
    }
    changed.timezone = patch.timezone;
  }

  const user = await currentUser();
  if (user) {
    await ensureUser({
      id: user.id,
      email:
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "",
      displayName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        null,
    });
  }

  const next = await upsertUserSettings(userId, changed);

  // Expire this user's cached settings so the shell re-renders with the new
  // values. `updateTag` (not `revalidateTag`) because we want
  // read-your-own-writes: the very next render after this action must see
  // the value that was just saved.
  //
  // The tag only exists once `getUserSettings` has run for this user, so a
  // first-ever save can legitimately have no entry to expire.
  try {
    updateTag(`settings:${userId}`);
  } catch {
    // No cache entry yet — nothing to expire.
  }

  return next;
}
