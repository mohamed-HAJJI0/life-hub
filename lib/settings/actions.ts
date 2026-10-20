"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { isValidTimezone } from "@/lib/time";
import {
  isAccentName,
  isBaseName,
  isChartName,
  isModePref,
} from "@/lib/theme/valid-values";
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

/** The subset of settings a client may change. */
export type SettingsPatch = Partial<
  Pick<
    UserSettings,
    | "language"
    | "timezone"
    | "themeBase"
    | "themeAccent"
    | "themeChart"
    | "themeMode"
  >
>;

/**
 * Save one or more settings for the signed-in user.
 *
 * Creates the `users` + `settings` rows on first save, then expires this
 * user's cached settings so the shell re-renders with the new values.
 */
export async function saveSettingsAction(patch: SettingsPatch): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  const changed: SettingsPatch = {};

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

  // The theme values are validated against the live registry lists, so a
  // hand-crafted request can't store a base/accent/chart that has no CSS
  // behind it.
  if (patch.themeBase !== undefined) {
    if (!isBaseName(patch.themeBase)) {
      throw new Error(`Unsupported theme base: ${patch.themeBase}`);
    }
    changed.themeBase = patch.themeBase;
  }

  if (patch.themeAccent !== undefined) {
    if (patch.themeAccent !== "default" && !isAccentName(patch.themeAccent)) {
      throw new Error(`Unsupported theme accent: ${patch.themeAccent}`);
    }
    changed.themeAccent = patch.themeAccent;
  }

  if (patch.themeChart !== undefined) {
    if (patch.themeChart !== "default" && !isChartName(patch.themeChart)) {
      throw new Error(`Unsupported theme chart: ${patch.themeChart}`);
    }
    changed.themeChart = patch.themeChart;
  }

  if (patch.themeMode !== undefined) {
    if (!isModePref(patch.themeMode)) {
      throw new Error(`Unsupported theme mode: ${patch.themeMode}`);
    }
    changed.themeMode = patch.themeMode;
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
