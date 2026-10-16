"use client";

// Theme cycle button. Click to rotate through the 4 themes in `lib/theme/themes.ts`.
//
// Why a cycle button instead of a dropdown:
//   The user picked "Cycle button" (minimal) when choosing components.
//   Adding `dropdown-menu` would mean 1 more shadcn dep just for the theme
//   picker. The cycle button uses the already-added `button` primitive.
//
// When the settings page is built (step 1 of the build plan), the full
// picker — with theme preview swatches and a "reset to default" action —
// will live there. This button is the everyday quick-switch.
//
// Per `AGENTS.md` §5: components live in `components/`. This is a domain
// component (knows about the theme system), not a generic UI primitive, so
// it does NOT go in `components/ui/` — that folder is reserved for shadcn
// primitives only.

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/use-theme";

export function ThemeToggle() {
  const { theme, cycle, themes } = useTheme();
  const index = themes.findIndex((t) => t.id === theme.id);
  const next = themes[(index + 1) % themes.length];

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={`Theme: ${theme.label}. Click to switch to ${next?.label ?? "next"}.`}
      title={`${theme.label} (click → ${next?.label ?? "next"})`}
    >
      <Palette />
    </Button>
  );
}
