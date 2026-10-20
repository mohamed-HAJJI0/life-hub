// Migration from old theme payload to the v3 shape.
//
// The first theme system stored `{ id: "taupe" | "zinc" | "neutral" | "stone" }`.
// The v2 system stored the same thing. The v3 system stores
// `{ base, accent, chart, modePref }`.
//
// On read, we coerce the old shape to the new one so the app boots cleanly
// for users with a previously-saved preference. Mode detection:
//   - If the old payload had any "dark" hint (`mode: "dark"`, `dark: true`),
//     keep the user's dark preference.
//   - Otherwise, default to "system" (no forced light).
//   - The old payload also used the OS-level `prefers-color-scheme` via the
//     system dark mode class — if that class was active, we map to "system".

import { DEFAULT_BASE, DEFAULT_ACCENT, DEFAULT_CHART, DEFAULT_MODE_PREF } from "./constants";
import type { ThemeConfig } from "./use-theme";

/** Old v1/v2 payloads are loose objects with an `id` (and optionally `mode`). */
type OldShape = { id: string; mode?: "light" | "dark" | "system" };

function hasId(parsed: unknown): parsed is { id: unknown } {
  return !!parsed && typeof parsed === "object" && "id" in (parsed as object);
}

function isModePref(v: unknown): v is ThemeConfig["modePref"] {
  return v === "light" || v === "dark" || v === "system";
}

function isBase(v: unknown): v is string {
  return typeof v === "string" && /^[a-z]+$/.test(v);
}

function isChartLike(v: unknown): v is string {
  return typeof v === "string" && /^[a-z]+$/.test(v);
}

/**
 * Coerce a stored JSON string into the v3 ThemeConfig shape. Returns null
 * if the value can't be interpreted.
 */
export function migrateStored(raw: string): ThemeConfig | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  // Old v1/v2 shape: { id, mode? }
  if (hasId(p)) {
    const old = p as OldShape;
    const base = isBase(old.id) ? old.id : DEFAULT_BASE;
    let modePref: ThemeConfig["modePref"] = DEFAULT_MODE_PREF;
    if (isModePref(old.mode)) {
      modePref = old.mode;
    } else if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      // The legacy system also tracked .dark on <html>; honor it if the
      // stored payload didn't carry an explicit mode.
      modePref = "dark";
    }
    return { base, accent: DEFAULT_ACCENT, chart: DEFAULT_CHART, modePref };
  }

  // v3 shape: { base, accent, chart, modePref }
  const base = isBase(p.base) ? p.base : DEFAULT_BASE;
  const accent = isChartLike(p.accent) ? p.accent : DEFAULT_ACCENT;
  const chart = isChartLike(p.chart) ? p.chart : DEFAULT_CHART;
  const modePref = isModePref(p.modePref) ? p.modePref : DEFAULT_MODE_PREF;
  return { base, accent, chart, modePref };
}
