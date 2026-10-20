import { describe, expect, it } from "vitest";
import {
  ACCENT_NAMES,
  BASE_NAMES,
  CHART_NAMES,
  MODE_PREFS,
  isAccentName,
  isBaseName,
  isChartName,
  isModePref,
} from "@/lib/theme/valid-values";

// These lists are the server-side gate for the theme settings: a hand-made
// request cannot store a base/accent/chart that has no CSS behind it. They
// are derived from the live shadcn registry data in `shadcn-data.json`.

describe("the registry lists", () => {
  it("has the 7 bases the theme editor offers", () => {
    expect(BASE_NAMES).toHaveLength(7);
    expect(BASE_NAMES).toContain("neutral");
    expect(BASE_NAMES).toContain("taupe");
  });

  it("has the 24 accents — 'default' is not one of them", () => {
    expect(ACCENT_NAMES).toHaveLength(24);
    // "default" means "no accent", so it is filtered out of the list and
    // special-cased by the server action instead.
    expect(ACCENT_NAMES).not.toContain("default");
    expect(ACCENT_NAMES).toContain("blue");
  });

  it("uses the accent names for the chart palettes", () => {
    expect(CHART_NAMES).toEqual(ACCENT_NAMES);
  });

  it("has exactly the three mode preferences", () => {
    expect(MODE_PREFS).toEqual(["light", "dark", "system"]);
  });
});

describe("isBaseName", () => {
  it("accepts a real base", () => {
    expect(isBaseName("neutral")).toBe(true);
    expect(isBaseName("taupe")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isBaseName("chartreuse")).toBe(false);
    expect(isBaseName("NEUTRAL")).toBe(false);
    expect(isBaseName("")).toBe(false);
    expect(isBaseName(42)).toBe(false);
    expect(isBaseName(null)).toBe(false);
    expect(isBaseName(undefined)).toBe(false);
  });
});

describe("isAccentName", () => {
  it("accepts a real accent", () => {
    expect(isAccentName("blue")).toBe(true);
    expect(isAccentName("red")).toBe(true);
  });

  it("rejects 'default' — it is not in the list", () => {
    // The server action allows "default" explicitly; the list itself does
    // not contain it.
    expect(isAccentName("default")).toBe(false);
  });

  it("rejects anything else", () => {
    expect(isAccentName("BLUE")).toBe(false);
    expect(isAccentName("")).toBe(false);
    expect(isAccentName(null)).toBe(false);
  });
});

describe("isChartName", () => {
  it("accepts a real chart palette", () => {
    expect(isChartName("violet")).toBe(true);
  });

  it("rejects 'default' and anything else", () => {
    expect(isChartName("default")).toBe(false);
    expect(isChartName("not-a-colour")).toBe(false);
    expect(isChartName(7)).toBe(false);
  });
});

describe("isModePref", () => {
  it("accepts the three modes", () => {
    expect(isModePref("light")).toBe(true);
    expect(isModePref("dark")).toBe(true);
    expect(isModePref("system")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isModePref("dim")).toBe(false);
    expect(isModePref("")).toBe(false);
    expect(isModePref(1)).toBe(false);
    expect(isModePref(null)).toBe(false);
  });
});
