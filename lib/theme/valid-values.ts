import shadcnData from "./shadcn-data.json";

// The canonical list of valid theme values, derived from the live shadcn
// registry data that `scripts/fetch-shadcn-data.mjs` downloads.
//
// This is the SERVER-side counterpart to the lists that used to live only
// in the Theme tab: the server action validates whatever the client sends
// against these, so a hand-crafted request can't poison the settings row
// with a base/accent/chart that has no CSS behind it.
//
// `lib/theme/constants.ts` stays dependency-free on purpose — the no-FOUC
// inline script imports it, and it must not pull in the JSON.

/** The 7 base colors. */
export const BASE_NAMES = Object.keys(shadcnData.bases);

/** The 24 accent colors ("default" excluded — it means "no accent"). */
export const ACCENT_NAMES = Object.keys(shadcnData.accents).filter(
  (name) => name !== "default",
);

/** The 24 chart palettes — same names as the accents. */
export const CHART_NAMES = ACCENT_NAMES;

export const MODE_PREFS = ["light", "dark", "system"] as const;

export type ModePref = (typeof MODE_PREFS)[number];

export function isBaseName(value: unknown): value is string {
  return typeof value === "string" && BASE_NAMES.includes(value);
}

export function isAccentName(value: unknown): value is string {
  return typeof value === "string" && ACCENT_NAMES.includes(value);
}

export function isChartName(value: unknown): value is string {
  return typeof value === "string" && CHART_NAMES.includes(value);
}

export function isModePref(value: unknown): value is ModePref {
  return (
    typeof value === "string" && (MODE_PREFS as readonly string[]).includes(value)
  );
}
