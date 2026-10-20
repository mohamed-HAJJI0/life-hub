import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDictionary,
  isLocale,
  resolveLocale,
  t,
} from "@/lib/i18n";

describe("LOCALES", () => {
  it("ships English and Chinese", () => {
    expect(LOCALES).toEqual(["en", "zh"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });
});

describe("getDictionary", () => {
  it("returns the dictionary for a supported locale", () => {
    expect(getDictionary("en")["nav.home"]).toBe("Home");
    expect(getDictionary("zh")["nav.home"]).toBe("首页");
  });

  it("falls back to English for an unsupported locale", () => {
    expect(getDictionary("fr")).toBe(getDictionary("en"));
    expect(getDictionary("")).toBe(getDictionary("en"));
  });
});

describe("isLocale", () => {
  it("accepts a supported locale", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("zh")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("resolveLocale", () => {
  it("keeps a supported locale", () => {
    expect(resolveLocale("zh")).toBe("zh");
    expect(resolveLocale("en")).toBe("en");
  });

  it("falls back to the default for anything else", () => {
    expect(resolveLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("t", () => {
  it("returns the translation", () => {
    expect(t(getDictionary("en"), "nav.home")).toBe("Home");
  });

  it("renders the key itself when a translation is missing", () => {
    // Gaps stay visible on purpose — a raw dotted key in the UI is a much
    // better bug report than an empty string.
    expect(t(getDictionary("en"), "does.not.exist")).toBe("does.not.exist");
  });
});
