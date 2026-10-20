import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCENT,
  DEFAULT_BASE,
  DEFAULT_CHART,
  DEFAULT_MODE_PREF,
} from "@/lib/theme/constants";
import { migrateStored } from "@/lib/theme/migration";

// A user who saved a theme under the v1/v2 shape ("taupe", "zinc", …) must
// still boot on the v3 system. The migration coerces the old payload on read.

describe("migrateStored — the v1/v2 shape", () => {
  it("carries the old base over and fills in the new fields", () => {
    expect(migrateStored('{"id":"taupe"}')).toEqual({
      base: "taupe",
      accent: DEFAULT_ACCENT,
      chart: DEFAULT_CHART,
      modePref: DEFAULT_MODE_PREF,
    });
  });

  it("keeps an explicit dark preference", () => {
    expect(migrateStored('{"id":"taupe","mode":"dark"}')?.modePref).toBe("dark");
    expect(migrateStored('{"id":"taupe","mode":"light"}')?.modePref).toBe("light");
  });

  it("falls back to the default for an unknown mode", () => {
    expect(migrateStored('{"id":"taupe","mode":"sepia"}')?.modePref).toBe(
      DEFAULT_MODE_PREF,
    );
  });

  it("falls back to the default base for a base that is not a name", () => {
    // The base must be a lowercase word — "TAUPE" and "123" are not.
    expect(migrateStored('{"id":"TAUPE"}')?.base).toBe(DEFAULT_BASE);
    expect(migrateStored('{"id":"123"}')?.base).toBe(DEFAULT_BASE);
  });
});

describe("migrateStored — the v3 shape", () => {
  it("passes a valid config straight through", () => {
    expect(
      migrateStored(
        '{"base":"mauve","accent":"blue","chart":"red","modePref":"dark"}',
      ),
    ).toEqual({
      base: "mauve",
      accent: "blue",
      chart: "red",
      modePref: "dark",
    });
  });

  it("replaces an invalid accent or chart with the default", () => {
    const result = migrateStored(
      '{"base":"mauve","accent":"BLUE","chart":"Red","modePref":"dark"}',
    );

    expect(result?.accent).toBe(DEFAULT_ACCENT);
    expect(result?.chart).toBe(DEFAULT_CHART);
  });

  it("replaces an invalid mode with the default", () => {
    const result = migrateStored('{"base":"mauve","modePref":"dim"}');

    expect(result?.modePref).toBe(DEFAULT_MODE_PREF);
  });
});

describe("migrateStored — unusable input", () => {
  it("returns null for something that is not JSON", () => {
    expect(migrateStored("not json")).toBeNull();
    expect(migrateStored("")).toBeNull();
  });

  it("returns null for JSON that is not an object", () => {
    expect(migrateStored("null")).toBeNull();
    expect(migrateStored('"a string"')).toBeNull();
    expect(migrateStored("42")).toBeNull();
  });

  it("falls back to the defaults for an object with nothing usable in it", () => {
    const expected = {
      base: DEFAULT_BASE,
      accent: DEFAULT_ACCENT,
      chart: DEFAULT_CHART,
      modePref: DEFAULT_MODE_PREF,
    };

    expect(migrateStored("{}")).toEqual(expected);
    expect(migrateStored("[]")).toEqual(expected);
  });
});
