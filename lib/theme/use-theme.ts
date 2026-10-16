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
//   - useState(DEFAULT_CONFIG) makes the server and first client render match.
//   - The no-FOUC <script> in <head> applies the user's saved attributes
//     before paint.
//   - On mount, the hook re-reads from localStorage and syncs React state.

import { useCallback, useEffect, useState } from "react";
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

function readStored(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return migrateStored(raw) ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeStored(cfg: ThemeConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // best-effort
  }
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
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);

  // Hydrate from localStorage on mount; the no-FOUC script already wrote
  // the attributes, this just keeps React state in sync.
  useEffect(() => {
    const stored = readStored();
    setConfig(stored);
    // Re-apply in case the script didn't run (e.g. in a future mode where
    // we don't ship it).
    applyToDom(stored);
  }, []);

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
  }, [config.modePref]);

  const update = useCallback((patch: Partial<ThemeConfig>) => {
    setConfig((current) => {
      const next: ThemeConfig = { ...current, ...patch };
      applyToDom(next);
      writeStored(next);
      return next;
    });
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
