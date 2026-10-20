import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_IDS,
  formatDateInTz,
  getTodayInTz,
  isKnownTimezone,
  isValidTimezone,
  startOfDayInTz,
  timezoneLabel,
  timezoneOffsetLabel,
  timezoneRegion,
} from "@/lib/time";

// The day boundary is the app's single most load-bearing piece of pure logic:
// every "is it due today?" check compares against `getTodayInTz`. Comparing
// raw `Date` objects gets it wrong for anyone not on UTC, so these tests
// pin the behaviour to real instants rather than to the implementation.

// 2026 US DST: starts 8 March, ends 1 November.
// 2026 EU DST: starts 29 March, ends 25 October.
const WINTER = new Date("2026-01-15T12:00:00Z");
const SUMMER = new Date("2026-07-15T12:00:00Z");

/** The wall-clock hour and minute of `date` in `timeZone`. */
function localTime(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { hour: Number(read("hour")) % 24, minute: read("minute") };
}

describe("getTodayInTz", () => {
  it("reads the calendar date in the user's zone, not in UTC", () => {
    const now = new Date("2026-03-15T23:30:00Z");

    // 23:30 UTC is already the 16th in Shanghai (+08:00).
    expect(getTodayInTz("Asia/Shanghai", now).isoDate).toBe("2026-03-16");
    // ...but still the 15th in Los Angeles (-07:00) and in UTC.
    expect(getTodayInTz("America/Los_Angeles", now).isoDate).toBe("2026-03-15");
    expect(getTodayInTz("UTC", now).isoDate).toBe("2026-03-15");
  });

  it("reads the date backwards for zones behind UTC", () => {
    const now = new Date("2026-03-15T00:30:00Z");

    // 00:30 UTC is still the 14th in Los Angeles.
    expect(getTodayInTz("America/Los_Angeles", now).isoDate).toBe("2026-03-14");
    expect(getTodayInTz("Asia/Shanghai", now).isoDate).toBe("2026-03-15");
  });

  it("returns the parts that agree with the ISO date", () => {
    const result = getTodayInTz("Asia/Shanghai", new Date("2026-03-15T23:30:00Z"));

    expect(result).toEqual({
      year: 2026,
      month: 3,
      day: 16,
      isoDate: "2026-03-16",
    });
  });

  it("zero-pads single-digit months and days", () => {
    const result = getTodayInTz("UTC", new Date("2026-01-05T00:00:00Z"));

    expect(result.isoDate).toBe("2026-01-05");
  });
});

describe("startOfDayInTz", () => {
  it("is local midnight in a zone ahead of UTC", () => {
    const start = startOfDayInTz("Asia/Shanghai", new Date("2026-03-15T23:30:00Z"));

    // The 16th in Shanghai starts at 16:00 UTC on the 15th.
    expect(start.toISOString()).toBe("2026-03-15T16:00:00.000Z");
  });

  it("is local midnight in a zone behind UTC", () => {
    const start = startOfDayInTz("America/Los_Angeles", new Date("2026-03-15T00:30:00Z"));

    // The 14th in Los Angeles starts at 07:00 UTC on the 14th.
    expect(start.toISOString()).toBe("2026-03-14T07:00:00.000Z");
  });

  it("lands on midnight in the target zone for every zone we offer", () => {
    const now = new Date("2026-07-15T12:00:00Z");

    for (const zone of TIMEZONE_IDS) {
      const start = startOfDayInTz(zone, now);
      expect(localTime(start, zone), `zone ${zone}`).toEqual({
        hour: 0,
        minute: "00",
      });
    }
  });

  it("is the same instant for zones that share an offset", () => {
    const now = new Date("2026-07-15T12:00:00Z");

    expect(startOfDayInTz("Europe/Berlin", now).toISOString()).toBe(
      startOfDayInTz("Europe/Paris", now).toISOString(),
    );
  });
});

describe("timezoneOffsetLabel", () => {
  it("formats the offset as UTC±HH:MM", () => {
    expect(timezoneOffsetLabel("Asia/Shanghai", SUMMER)).toBe("UTC+08:00");
    expect(timezoneOffsetLabel("America/New_York", WINTER)).toBe("UTC-05:00");
    expect(timezoneOffsetLabel("Europe/Berlin", WINTER)).toBe("UTC+01:00");
    expect(timezoneOffsetLabel("UTC", SUMMER)).toBe("UTC+00:00");
  });

  it("follows daylight saving time", () => {
    expect(timezoneOffsetLabel("America/New_York", SUMMER)).toBe("UTC-04:00");
    expect(timezoneOffsetLabel("Europe/Berlin", SUMMER)).toBe("UTC+02:00");
  });
});

describe("isValidTimezone", () => {
  it("accepts real IANA zones", () => {
    expect(isValidTimezone("Europe/Berlin")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Asia/Shanghai")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone("   ")).toBe(false);
    expect(isValidTimezone(42)).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone(undefined)).toBe(false);
  });
});

describe("isKnownTimezone", () => {
  it("is the curated subset we offer in the picker", () => {
    expect(isKnownTimezone("Asia/Shanghai")).toBe(true);
    expect(isKnownTimezone("America/Argentina/Buenos_Aires")).toBe(true);
  });

  it("rejects a valid IANA zone that is not in the curated list", () => {
    // The distinction matters: `isValidTimezone` gates server-action input,
    // `isKnownTimezone` only decides what the picker shows.
    expect(isValidTimezone("Antarctica/Troll")).toBe(true);
    expect(isKnownTimezone("Antarctica/Troll")).toBe(false);
  });
});

describe("TIMEZONE_IDS", () => {
  it("has no duplicates", () => {
    expect(new Set(TIMEZONE_IDS).size).toBe(TIMEZONE_IDS.length);
  });

  it("only contains zones the runtime recognises", () => {
    for (const zone of TIMEZONE_IDS) {
      expect(isValidTimezone(zone), `zone ${zone}`).toBe(true);
    }
  });

  it("defaults to UTC", () => {
    expect(DEFAULT_TIMEZONE).toBe("UTC");
  });
});

describe("timezoneLabel / timezoneRegion", () => {
  it("labels a zone with its city", () => {
    expect(timezoneLabel("Asia/Shanghai")).toBe("Shanghai");
    expect(timezoneLabel("America/New_York")).toBe("New York");
    expect(timezoneLabel("Europe/Berlin")).toBe("Berlin");
    expect(timezoneLabel("UTC")).toBe("UTC");
  });

  it("groups a zone by its region", () => {
    expect(timezoneRegion("Asia/Shanghai")).toBe("Asia");
    expect(timezoneRegion("Europe/Berlin")).toBe("Europe");
    expect(timezoneRegion("UTC")).toBe("UTC");
  });
});

describe("formatDateInTz", () => {
  it("renders the date in the target zone", () => {
    const date = new Date("2026-03-15T23:30:00Z");

    const shanghai = formatDateInTz(date, "Asia/Shanghai");
    expect(shanghai).toContain("16");
    expect(shanghai).toContain("2026");

    const utc = formatDateInTz(date, "UTC");
    expect(utc).toContain("15");
    expect(utc).toContain("2026");
  });
});
