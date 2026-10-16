"use client";

// Theme tab content — rendered inside Clerk's <UserProfile /> as a custom
// page (url="theme"). Five sections, top to bottom:
//
//   1. Mode  — Light / Dark / System segmented control.
//   2. Base  — 7 swatches (neutral, stone, zinc, mauve, olive, mist, taupe).
//              The active base provides every token; surfaces stay with it.
//   3. Theme color — 24 round dots (the 17 named accents + the 7 base
//              names; a base name used here only overrides the 11
//              primary-related keys, never surfaces).
//   4. Chart color — 24 swatches. "Default" defers to the active theme
//              color's chart-1..5 (or the base's when theme color is also
//              Default).
//   5. Reset — back to { base: "neutral", accent: "default", chart: "default",
//              modePref: "system" }.
//
// Live apply: every click writes to localStorage AND sets the 4 attributes
// on <html>. No save button.
//
// Per AGENTS.md §5: each tab's content lives in its own file so adding more
// tabs is a one-file change. Mounted in `settings-modal.tsx`.

import { Circle, Frame, Moon, RotateCcw, Sun } from "lucide-react";
import shadcnData from "@/lib/theme/shadcn-data.json";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils";

// The static source of truth for the picker. Names + labels come from
// `fetch-shadcn-data.mjs` (BASE_NAMES + the 24 expected accents in
// registry/themes.ts). Swatch colors come from the JSON, so each option
// previews the actual color it would apply, not the live `--primary`.

type Mode = "light" | "dark";

type BaseEntry = { label: string; light: Record<string, string>; dark: Record<string, string> };
type AccentEntry = { label: string; light: Record<string, string>; dark: Record<string, string> };

const BASES = [
  "neutral",
  "stone",
  "zinc",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

const ACCENT_NAMES = [
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "mauve",
  "mist",
  "neutral",
  "olive",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "stone",
  "taupe",
  "teal",
  "violet",
  "yellow",
  "zinc",
] as const;

/** A swatch that previews the color this option would apply. */
function Swatch({
  name,
  /** Solid OKLCH string to display. */
  color,
  active,
  onClick,
  shape = "square",
}: {
  name: string;
  color: string;
  active: boolean;
  onClick: () => void;
  shape?: "square" | "circle";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <span
        className={cn(
          "border transition-all",
          shape === "square" ? "h-10 w-10 rounded-md" : "h-8 w-8 rounded-full",
          active
            ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
            : "border-border group-hover:scale-105",
        )}
        style={{ backgroundColor: color }}
      />
      <span
        className={cn(
          "text-[10px] leading-none",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {name}
      </span>
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function ModeSegmented({
  modePref,
  onChange,
}: {
  modePref: "light" | "dark" | "system";
  onChange: (m: "light" | "dark" | "system") => void;
}) {
  const opts: { value: "light" | "dark" | "system"; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="size-3.5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-3.5" /> },
    { value: "system", label: "System", icon: <Frame className="size-3.5" /> },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Color mode"
      className="inline-flex rounded-md border border-border bg-muted/30 p-0.5"
    >
      {opts.map((o) => {
        const active = modePref === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Pick the best "identity" color for a base to show in a swatch. */
function baseSwatchColor(b: BaseEntry, mode: Mode): string {
  // For the base swatch we show muted-foreground — it's a mid-tone that
  // uniquely identifies the base even in light or dark mode.
  return b[mode]["muted-foreground"] ?? b[mode].primary ?? "#888";
}

function accentSwatchColor(a: AccentEntry, mode: Mode): string {
  return a[mode].primary ?? "#888";
}

function chartSwatchColor(a: AccentEntry, mode: Mode): string {
  return a[mode]["chart-1"] ?? a[mode].primary ?? "#888";
}

export function ThemeTabContent() {
  const {
    config,
    mode,
    modePref,
    setBase,
    setAccent,
    setChart,
    setModePref,
    resetTheme,
  } = useTheme();
  // For swatch previews, we use the resolved mode (light/dark, not the
  // user preference) so the picker shows the live variant of the same
  // option — System mode resolves to whatever the OS reports.
  const previewMode: Mode = mode;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Mode */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Mode"
          description="Pick a color mode. System follows your OS preference and updates live when it changes."
        />
        <ModeSegmented modePref={modePref} onChange={setModePref} />
      </div>

      {/* Base */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Base color"
          description="Sets every token — surfaces, charts, sidebar — for the active mode."
        />
        <div className="grid grid-cols-7 gap-2">
          {BASES.map((b) => {
            const entry = shadcnData.bases[b] as BaseEntry;
            return (
              <Swatch
                key={b}
                name={entry.label}
                color={baseSwatchColor(entry, previewMode)}
                active={config.base === b}
                onClick={() => setBase(b)}
              />
            );
          })}
        </div>
      </div>

      {/* Theme color (accent) */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Theme color"
          description="Overrides the 11 primary-related tokens on top of the active base. Surfaces stay with the base."
        />
        <div className="grid grid-cols-8 gap-2">
          {/* "Default" option — no rule, base primary wins. */}
          <button
            type="button"
            onClick={() => setAccent("default")}
            aria-pressed={config.accent === "default"}
            aria-label="Default theme color"
            className={cn(
              "group relative flex flex-col items-center gap-1.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border bg-background transition-all",
                config.accent === "default"
                  ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "border-border group-hover:scale-105",
              )}
            >
              <Circle className="size-3.5 text-muted-foreground" />
            </span>
            <span
              className={cn(
                "text-[10px] leading-none",
                config.accent === "default"
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Default
            </span>
          </button>
          {ACCENT_NAMES.map((a) => {
            const entry = shadcnData.accents[a] as AccentEntry | null;
            if (!entry) return null;
            return (
              <Swatch
                key={a}
                name={entry.label}
                color={accentSwatchColor(entry, previewMode)}
                active={config.accent === a}
                onClick={() => setAccent(a)}
                shape="circle"
              />
            );
          })}
        </div>
      </div>

      {/* Chart color */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Chart color"
          description="Overrides chart-1..5. Default defers to the active theme color."
        />
        <div className="grid grid-cols-8 gap-2">
          <button
            type="button"
            onClick={() => setChart("default")}
            aria-pressed={config.chart === "default"}
            aria-label="Default chart color (follows theme color)"
            className={cn(
              "group relative flex flex-col items-center gap-1.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border bg-background transition-all",
                config.chart === "default"
                  ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "border-border group-hover:scale-105",
              )}
            >
              <span className="text-[8px] font-medium leading-none text-muted-foreground">
                Auto
              </span>
            </span>
            <span
              className={cn(
                "text-[10px] leading-none",
                config.chart === "default"
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Default
            </span>
          </button>
          {ACCENT_NAMES.map((a) => {
            const entry = shadcnData.accents[a] as AccentEntry | null;
            if (!entry) return null;
            return (
              <Swatch
                key={a}
                name={entry.label}
                color={chartSwatchColor(entry, previewMode)}
                active={config.chart === a}
                onClick={() => setChart(a)}
              />
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Saved to <code className="font-mono text-[10px]">localStorage</code>{" "}
          under <code className="font-mono text-[10px]">life-hub:theme</code>.
        </p>
        <button
          type="button"
          onClick={resetTheme}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
