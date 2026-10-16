"use client";

// React hook for theme state.
//
// Why a hook and not a context:
//   Theme is a single value, used in one place (the cycle button) right now.
//   Adding Context for one consumer is premature. If a second consumer
//   appears (e.g. the future settings page), we promote to Context.
//
// SSR-safety:
//   - `useState(DEFAULT_THEME)` ensures the server and the first client
//     render produce the same HTML (no hydration mismatch).
//   - The actual localStorage read happens in a `useEffect`, which only
//     runs on the client. This means there's a brief window where the
//     server-rendered HTML uses DEFAULT_THEME; the no-FOUC <script> in
//     <head> applies the user's saved theme BEFORE paint, so the user
//     doesn't see the default flash.

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  STORAGE_KEY,
  THEMES,
  type Theme,
  type ThemeId,
} from "./themes";

function isValidId(id: unknown): id is ThemeId {
  return typeof id === "string" && THEMES.some((t) => t.id === id);
}

function readStored(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      const id = (parsed as { id: unknown }).id;
      if (isValidId(id)) return id;
    }
  } catch {
    // localStorage disabled, JSON malformed, etc. — fall through.
  }
  return null;
}

function writeStored(id: ThemeId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id }));
  } catch {
    // Ignore — best-effort persistence.
  }
}

export function useTheme() {
  // SSR-safe: server and first client render use DEFAULT_THEME.
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  // After mount, hydrate from localStorage and apply to <html>.
  // This is a one-time effect; the no-FOUC script already set data-theme
  // before paint, so this just keeps React state in sync.
  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== themeId) {
      setThemeId(stored);
    }
    // We only want this on mount; themeId is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", id);
    }
    writeStored(id);
  }, []);

  const cycle = useCallback(() => {
    setThemeId((current) => {
      const idx = THEMES.findIndex((t) => t.id === current);
      const next = THEMES[(idx + 1) % THEMES.length]!;
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next.id);
      }
      writeStored(next.id);
      return next.id;
    });
  }, []);

  const theme: Theme =
    THEMES.find((t) => t.id === themeId) ?? (THEMES[0] as Theme);

  return {
    theme,
    themeId,
    setTheme,
    cycle,
    themes: THEMES,
  };
}
