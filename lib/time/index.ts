// Timezone-aware date utilities.
//
// Everything user-facing that has a "day" boundary (streaks, "due today",
// the Today view) must be computed in the *user's* timezone, not the
// server's UTC. These helpers are the single place that conversion happens.
//
// `lib/settings/` owns the stored timezone; this file owns the math.

/**
 * A curated list of IANA timezones offered in Settings → Timezone.
 *
 * Deliberately not `Intl.supportedValuesOf("timeZone")` — that returns ~400
 * zones and makes the dropdown unusable. "Auto-detect" covers the rest: the
 * user's browser reports their zone, and any zone can still be set manually
 * by pasting an IANA id.
 */
export const TIMEZONE_IDS = [
  "UTC",
  // Africa
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Lagos",
  "Africa/Nairobi",
  // America
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  // Asia
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tokyo",
  // Atlantic / Pacific
  "Atlantic/Reykjavik",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
  // Europe
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Kyiv",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  // Australia
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Sydney",
] as const;

export type TimezoneId = (typeof TIMEZONE_IDS)[number];

export const DEFAULT_TIMEZONE = "UTC";

/** "Asia/Shanghai" → "Shanghai", "UTC" → "UTC". */
export function timezoneLabel(timezone: string): string {
  if (timezone === "UTC") return "UTC";
  const city = timezone.split("/").pop() ?? timezone;
  return city.replace(/_/g, " ");
}

/** The region part of an IANA id, for grouping in the picker. */
export function timezoneRegion(timezone: string): string {
  if (timezone === "UTC") return "UTC";
  const parts = timezone.split("/");
  return parts.length > 1 ? parts[0] : "Other";
}

/** The user's browser timezone. Falls back to UTC when unavailable. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Is this a timezone the app offers in the picker? */
export function isKnownTimezone(timezone: string): boolean {
  return (TIMEZONE_IDS as readonly string[]).includes(timezone);
}

/**
 * Is this a valid IANA timezone id?
 *
 * Broader than `isKnownTimezone` — it accepts any zone the runtime
 * recognises, so a user can set a zone that isn't in the curated list. Used
 * to validate server-action input.
 */
export function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== "string" || timezone.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

/**
 * The calendar date in the given timezone, as `YYYY-MM-DD`.
 *
 * This is the value every "is it due today?" check should compare against —
 * comparing `Date` objects directly gets the day boundary wrong for anyone
 * not on UTC.
 */
export function getTodayInTz(
  timezone: string,
  now: Date = new Date(),
): { year: number; month: number; day: number; isoDate: string } {
  // "en-CA" formats as YYYY-MM-DD.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const year = read("year");
  const month = read("month");
  const day = read("day");

  return {
    year,
    month,
    day,
    isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

/** Format a date in the given timezone. */
export function formatDateInTz(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: timezone }).format(
    date,
  );
}

/**
 * The start of the given day in the given timezone, as a UTC Date.
 *
 * Useful for range queries: "everything that happened today" becomes
 * `>= startOfDayInTz(tz)` and `< startOfNextDayInTz(tz)`.
 */
export function startOfDayInTz(
  timezone: string,
  now: Date = new Date(),
): Date {
  const { isoDate } = getTodayInTz(timezone, now);
  // Midnight in the target zone → UTC instant. `T00:00:00` is read as local
  // time, so we ask Intl for the zone's own offset instead of guessing.
  const [year, month, day] = isoDate.split("-").map(Number);
  const offset = getTimezoneOffsetMs(timezone, now);
  return new Date(Date.UTC(year, month - 1, day) - offset);
}

/** The offset of `timezone` from UTC, in milliseconds, at `now`. */
function getTimezoneOffsetMs(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second"),
  );

  return asUtc - now.getTime();
}

/**
 * A human-readable UTC offset for a zone, e.g. "UTC+08:00".
 *
 * Shown next to the timezone picker so the user can confirm the zone they
 * picked is the one they meant (a common mistake: picking a city with the
 * same name in the wrong region).
 */
export function timezoneOffsetLabel(
  timezone: string,
  now: Date = new Date(),
): string {
  let offsetMs: number;
  try {
    offsetMs = getTimezoneOffsetMs(timezone, now);
  } catch {
    return "UTC";
  }

  const sign = offsetMs < 0 ? "-" : "+";
  const totalMinutes = Math.abs(Math.round(offsetMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
