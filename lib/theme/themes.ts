// Theme definitions for Life Hub.
//
// Why this file exists:
//   shadcn baked the taupe tokens into `app/globals.css` :root. To make the
//   theme user-editable (per the brief: "editable in settings later"), the
//   source of truth for *which themes exist* and *what their light values are*
//   must be data — not hand-written CSS rules — so a future settings page can
//   edit them and the values flow into both:
//     - the no-FOUC <script> (sets <html data-theme>)
//     - the cycle button in the topbar
//
// Source for the values:
//   - taupe light: shadcn init wrote these into `app/globals.css` :root.
//   - zinc / neutral / stone light: shadcn v4 standard OKLCH presets.
//
// Dark variants are intentionally omitted in this round. Dark mode is a
// separate control and will be added when the settings page is built (see
// `plans/2026-10-16_1608-project-plan-and-structure.md` step 1).
// The data shape already has room for them: just add a `dark` field to each
// theme and add the corresponding CSS overrides.
//
// Per `AGENTS.md` §5, theme data lives in `lib/theme/`; the cycle button
// component lives in `components/` (not in this folder).

export type ThemeId = "taupe" | "zinc" | "neutral" | "stone";

/** CSS variable name → OKLCH value (e.g. `--background: oklch(1 0 0)`). */
export type ThemeTokens = Record<string, string>;

export type Theme = {
  id: ThemeId;
  label: string;
  /** Token values for the light variant. */
  light: ThemeTokens;
  /** Token values for the dark variant. (Reserved — empty for now.) */
  dark: ThemeTokens;
};

/** localStorage key. Keep in sync with `use-theme.ts`. */
export const STORAGE_KEY = "life-hub:theme";

/** The default theme — applied on first load, before any user choice. */
export const DEFAULT_THEME: ThemeId = "taupe";

export const THEMES: Theme[] = [
  {
    id: "taupe",
    label: "Taupe",
    // These values MUST match `:root` in `app/globals.css` (the block shadcn
    // init wrote). If you change one here, change it there too.
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.147 0.004 49.3)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.147 0.004 49.3)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.147 0.004 49.3)",
      "--primary": "oklch(0.508 0.118 165.612)",
      "--primary-foreground": "oklch(0.979 0.021 166.113)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.96 0.002 17.2)",
      "--muted-foreground": "oklch(0.547 0.021 43.1)",
      "--accent": "oklch(0.96 0.002 17.2)",
      "--accent-foreground": "oklch(0.214 0.009 43.1)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.922 0.005 34.3)",
      "--input": "oklch(0.922 0.005 34.3)",
      "--ring": "oklch(0.714 0.014 41.2)",
    },
    dark: {},
  },
  {
    id: "zinc",
    label: "Zinc",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.21 0.006 285.885)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {},
  },
  {
    id: "neutral",
    label: "Neutral",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.145 0 0)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.145 0 0)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.145 0 0)",
      "--primary": "oklch(0.205 0 0)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.97 0 0)",
      "--secondary-foreground": "oklch(0.205 0 0)",
      "--muted": "oklch(0.97 0 0)",
      "--muted-foreground": "oklch(0.556 0 0)",
      "--accent": "oklch(0.97 0 0)",
      "--accent-foreground": "oklch(0.205 0 0)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.922 0 0)",
      "--input": "oklch(0.922 0 0)",
      "--ring": "oklch(0.708 0 0)",
    },
    dark: {},
  },
  {
    id: "stone",
    label: "Stone",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.147 0.004 49.3)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.147 0.004 49.3)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.147 0.004 49.3)",
      "--primary": "oklch(0.216 0.006 56.043)",
      "--primary-foreground": "oklch(0.985 0.001 106.423)",
      "--secondary": "oklch(0.97 0.001 106.424)",
      "--secondary-foreground": "oklch(0.216 0.006 56.043)",
      "--muted": "oklch(0.97 0.001 106.424)",
      "--muted-foreground": "oklch(0.553 0.013 58.071)",
      "--accent": "oklch(0.97 0.001 106.424)",
      "--accent-foreground": "oklch(0.216 0.006 56.043)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.923 0.003 48.717)",
      "--input": "oklch(0.923 0.003 48.717)",
      "--ring": "oklch(0.709 0.01 56.259)",
    },
    dark: {},
  },
];
