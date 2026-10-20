"use client";

// React hook for theme state (v3 — base + accent + chart + mode).
//
// The runtime is driven by the static CSS in `app/theme-tokens.css`:
//   - [data-base="X"][data-mode="Y"]   sets the full token set
//   - [data-accent="X"][data-mode="Y"] overrides 11 primary-related keys
//   - [data-chart="X"][data-mode="Y"]  overrides chart-1..5
//
// This hook only sets the 4 attributes on <html> and a `.dark` class for
// shadcn's `dark:` variant. It does NOT touch any CSS variables — those
// come from the static CSS.
//
// SSR-safety:
//   - useSyncExternalStore's getServerSnapshot returns DEFAULT_CONFIG, so
//     the server and first client render match.
//   - The no-FOUC <script> in <head> applies the user's saved attributes
//     before paint.
//   - After hydration the store re-reads from localStorage and the DOM is
//     re-applied from the resolved config.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { STORAGE_KEY } from "./constants";
import { migrateStored } from "./migration";

export type Mode = "light" | "dark";
export type ModePref = "light" | "dark" | "system";

export type ThemeConfig = {
  base: string;
  accent: string;
  chart: string;
  modePref: ModePref;
};

const DEFAULT_CONFIG: ThemeConfig = {
  base: "neutral",
  accent: "default",
  chart: "default",
  modePref: "system",
};

// `useSyncExternalStore` requires getSnapshot to return a *stable* value —
// a fresh object every call would loop forever. So we memoise the parsed
// config against the raw localStorage string: same raw → same object.
let cachedRaw: string | null = null;
let cachedConfig: ThemeConfig = DEFAULT_CONFIG;

function readStored(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_CONFIG;
  }

  if (raw === cachedRaw) return cachedConfig;

  cachedRaw = raw;
  cachedConfig = raw ? (migrateStored(raw) ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;
  return cachedConfig;
}

function writeStored(cfg: ThemeConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // best-effort
  }
}

/**
 * Fired whenever *this* tab writes the theme. The native `storage` event
 * only fires in *other* tabs, so we need our own for same-tab updates.
 */
const THEME_EVENT = "life-hub:theme-changed";

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function getThemeSnapshot(): ThemeConfig {
  return readStored();
}

function getThemeServerSnapshot(): ThemeConfig {
  return DEFAULT_CONFIG;
}

/** Resolve the user's modePref to a concrete mode using the OS preference. */
function resolveMode(pref: ModePref): Mode {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

/**
 * Single source of truth for "how the DOM should look right now". Sets
 * data-base / data-accent / data-chart / data-mode on <html> plus the
 * `.dark` class (so shadcn's `dark:` variant flips with mode).
 */
function applyToDom(cfg: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mode = resolveMode(cfg.modePref);
  root.setAttribute("data-base", cfg.base);
  root.setAttribute("data-accent", cfg.accent);
  root.setAttribute("data-chart", cfg.chart);
  root.setAttribute("data-mode", mode);
  root.classList.toggle("dark", mode === "dark");
}

export function useTheme() {
  const config = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  // Re-apply to the DOM whenever the resolved config changes. The no-FOUC
  // script already wrote the attributes before paint; this keeps React state
  // and the DOM in sync (and covers the case where the script didn't run).
  useEffect(() => {
    applyToDom(config);
  }, [config]);

  // Listen for OS color-scheme changes when the user is on "system" mode,
  // and re-apply so the `.dark` class and `data-mode` flip together.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (config.modePref === "system") applyToDom(config);
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [config]);

  const update = useCallback((patch: Partial<ThemeConfig>) => {
    const next: ThemeConfig = { ...readStored(), ...patch };
    applyToDom(next);
    writeStored(next);
    // Tell our own store the value changed. `readStored` re-parses because
    // the raw string differs from the memoised one.
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const setBase = useCallback((base: string) => update({ base }), [update]);
  const setAccent = useCallback(
    (accent: string) => update({ accent }),
    [update],
  );
  const setChart = useCallback((chart: string) => update({ chart }), [update]);
  const setModePref = useCallback(
    (modePref: ModePref) => update({ modePref }),
    [update],
  );
  const resetTheme = useCallback(() => {
    update(DEFAULT_CONFIG);
  }, [update]);

  const mode = resolveMode(config.modePref);

  return {
    config,
    mode,
    modePref: config.modePref,
    setBase,
    setAccent,
    setChart,
    setModePref,
    resetTheme,
  };
}
