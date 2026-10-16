"use client";

// Theme tab content — rendered inside Clerk's <UserProfile /> as a custom
// page (url="theme"). Compact: one row of 3 selectors (Base / Theme / Chart)
// + a full-width Mode control above + a Reset action below.
//
// All theme data (label + dot color) comes from `lib/theme/shadcn-data.json`.
// The three selectors call the same setters the previous grid used, so live
// apply + localStorage persistence + the no-FOUC <script> stay in sync.
//
// Per AGENTS.md §5: each tab's content lives in its own file. Mounted in
// `settings-modal.tsx`.

import { ChevronDown, Circle, RotateCcw, Sun, Moon, Frame } from "lucide-react";
import {
  Select,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import shadcnData from "@/lib/theme/shadcn-data.json";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils";

// Name lists + labels. These mirror the BASE_NAMES / expected accent list in
// `scripts/fetch-shadcn-data.mjs` so the dropdown options line up with the
// generated CSS selectors.
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

type BaseEntry = { label: string; light: Record<string, string>; dark: Record<string, string> };
type AccentEntry = { label: string; light: Record<string, string>; dark: Record<string, string> };

// shadcn-data.json has literal-union types for bases / accents. Cast to
// Record<string, ...> for runtime lookup by name (the names we pass are
// already validated by the BASES / ACCENT_NAMES constants).
const basesByName = shadcnData.bases as Record<string, BaseEntry>;
const accentsByName = shadcnData.accents as Record<string, AccentEntry | null>;

const DEFAULT_DOT = "transparent";

/**
 * Color a Base swatch: muted-foreground uniquely identifies each base in
 * both light and dark mode (the value is the mid-tone in the base's family).
 */
function baseColor(b: BaseEntry | null | undefined, mode: "light" | "dark"): string {
  if (!b) return DEFAULT_DOT;
  return b[mode]["muted-foreground"] ?? b[mode].primary ?? DEFAULT_DOT;
}
function accentPrimaryColor(a: AccentEntry | null | undefined, mode: "light" | "dark"): string {
  if (!a) return DEFAULT_DOT;
  return a[mode].primary ?? DEFAULT_DOT;
}
function accentChart1Color(a: AccentEntry | null | undefined, mode: "light" | "dark"): string {
  if (!a) return DEFAULT_DOT;
  return a[mode]["chart-1"] ?? a[mode].primary ?? DEFAULT_DOT;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Round swatch dot — a 14px circle filled with `color`, with a 1px
 * `border-border` so pale values (Lime, Neutral, Mist in light mode) don't
 * disappear against the trigger's bg-background.
 */
function ColorDot({
  color,
  className,
  empty = false,
}: {
  color: string;
  className?: string;
  /** Render an empty ring instead of a fill (used for the Chart "Default"). */
  empty?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3.5 shrink-0 rounded-full border border-border",
        className,
      )}
      style={empty ? { background: "transparent" } : { background: color }}
    />
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </label>
  );
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
  // previewMode resolves the user's preference to the actual applied mode so
  // the dots in the dropdowns always show the variant that's currently live.
  const previewMode: "light" | "dark" = mode;

  // Build a `value → label` map for the Value render functions.
  const baseLabels: Record<string, string> = Object.fromEntries(
    BASES.map((b) => [b, basesByName[b]?.label ?? titleCase(b)]),
  );
  const accentLabels: Record<string, string> = Object.fromEntries(
    ACCENT_NAMES.map((a) => [
      a,
      accentsByName[a]?.label ?? titleCase(a),
    ]),
  );

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Mode — full-width segmented control, each segment 1/3. */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Mode</FieldLabel>
        <div
          role="radiogroup"
          aria-label="Color mode"
          className="inline-flex w-full rounded-md border border-border bg-muted/30 p-0.5"
        >
          {(
            [
              { value: "light" as const, label: "Light", Icon: Sun },
              { value: "dark" as const, label: "Dark", Icon: Moon },
              { value: "system" as const, label: "System", Icon: Frame },
            ]
          ).map(({ value, label, Icon }) => {
            const active = modePref === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setModePref(value)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Base / Theme / Chart — three Selects, single row, equal widths. */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Colors</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Base */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Base</FieldLabel>
            <Select
              value={config.base}
              onValueChange={(v) => v && setBase(v as typeof config.base)}
            >
              <SelectTrigger aria-label="Base color">
                <ColorDot color={baseColor(basesByName[config.base], previewMode)} />
                <SelectValue>
                  {(value: string | null) =>
                    value ? (baseLabels[value] ?? titleCase(value)) : "—"
                  }
                </SelectValue>
                <SelectIcon>
                  <ChevronDown className="size-3.5" />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      {BASES.map((b) => (
                        <SelectItem key={b} value={b}>
                          <ColorDot
                            color={baseColor(basesByName[b], previewMode)}
                          />
                          <span className="truncate">{baseLabels[b] ?? titleCase(b)}</span>
                          <SelectItemIndicator>
                            <Circle className="size-3 fill-current" />
                          </SelectItemIndicator>
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
          </div>

          {/* Theme color */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Theme</FieldLabel>
            <Select
              value={config.accent}
              onValueChange={(v) => v !== null && setAccent(v)}
            >
              <SelectTrigger aria-label="Theme color">
                {config.accent === "default" ? (
                  <ColorDot color={DEFAULT_DOT} empty />
                ) : (
                  <ColorDot
                    color={accentPrimaryColor(
                      accentsByName[config.accent],
                      previewMode,
                    )}
                  />
                )}
                <SelectValue>
                  {(value: string | null) =>
                    value === "default"
                      ? "Default"
                      : (accentLabels[value as string] ?? titleCase(value ?? ""))
                  }
                </SelectValue>
                <SelectIcon>
                  <ChevronDown className="size-3.5" />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      <SelectItem value="default">
                        <ColorDot color={DEFAULT_DOT} empty />
                        <span className="truncate">Default</span>
                        <SelectItemIndicator>
                          <Circle className="size-3 fill-current" />
                        </SelectItemIndicator>
                      </SelectItem>
                      {ACCENT_NAMES.map((a) => {
                        const entry = accentsByName[a];
                        if (!entry) return null;
                        return (
                          <SelectItem key={a} value={a}>
                            <ColorDot color={accentPrimaryColor(entry, previewMode)} />
                            <span className="truncate">{entry.label}</span>
                            <SelectItemIndicator>
                              <Circle className="size-3 fill-current" />
                            </SelectItemIndicator>
                          </SelectItem>
                        );
                      })}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
          </div>

          {/* Chart color */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Chart</FieldLabel>
            <Select
              value={config.chart}
              onValueChange={(v) => v !== null && setChart(v)}
            >
              <SelectTrigger aria-label="Chart color">
                {config.chart === "default" ? (
                  <ColorDot color={DEFAULT_DOT} empty />
                ) : (
                  <ColorDot
                    color={accentChart1Color(
                      accentsByName[config.chart],
                      previewMode,
                    )}
                  />
                )}
                <SelectValue>
                  {(value: string | null) =>
                    value === "default"
                      ? "Default (follows theme)"
                      : (accentLabels[value as string] ?? titleCase(value ?? ""))
                  }
                </SelectValue>
                <SelectIcon>
                  <ChevronDown className="size-3.5" />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      <SelectItem value="default">
                        <ColorDot color={DEFAULT_DOT} empty />
                        <span className="truncate">Default (follows theme)</span>
                        <SelectItemIndicator>
                          <Circle className="size-3 fill-current" />
                        </SelectItemIndicator>
                      </SelectItem>
                      {ACCENT_NAMES.map((a) => {
                        const entry = accentsByName[a];
                        if (!entry) return null;
                        return (
                          <SelectItem key={a} value={a}>
                            <ColorDot color={accentChart1Color(entry, previewMode)} />
                            <span className="truncate">{entry.label}</span>
                            <SelectItemIndicator>
                              <Circle className="size-3 fill-current" />
                            </SelectItemIndicator>
                          </SelectItem>
                        );
                      })}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between border-t border-border pt-3">
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
