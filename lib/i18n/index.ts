import en from "./messages/en.json";
import zh from "./messages/zh.json";

// Translations for the app shell.
//
// Scope: shell strings only (nav, home, today, settings tab labels, user
// menu). Feature modules translate their own strings as they are built —
// see `plans/2026-10-20_1640-db-layer-and-settings.md`.
//
// Adding a language = add one JSON file with the same keys, add it to
// LOCALES and to DICTIONARIES below. Nothing else changes.

export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Native names — a language is named in its own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export type Dictionary = Record<string, string>;

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  zh,
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/** The dictionary for a locale, falling back to the default. */
export function getDictionary(locale: string): Dictionary {
  return DICTIONARIES[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

/** Look up a key. Missing keys render as the key itself, so gaps are visible. */
export function t(dict: Dictionary, key: string): string {
  return dict[key] ?? key;
}
