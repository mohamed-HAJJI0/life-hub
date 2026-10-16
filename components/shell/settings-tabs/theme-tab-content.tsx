"use client";

// Theme tab content — rendered inside Clerk's <UserProfile /> as a custom
// page (url="theme"). Mirrors the "Active theme" card from the home page
// (app/(lobby)/page.tsx): list of all 4 themes with color swatches and
// active/default indicators. Click a row to apply.
//
// Per the user's plan: each tab's content lives in its own file so adding
// more tabs is a one-file change. Mounted in `settings-modal.tsx`.

import { Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_THEME } from "@/lib/theme/themes";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils";

export function ThemeTabContent() {
  const { themeId, setTheme, themes } = useTheme();

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4" />
            Active theme
          </CardTitle>
          <CardDescription>
            Pick a theme. Your choice is saved in{" "}
            <code className="font-mono text-xs">localStorage</code> under{" "}
            <code className="font-mono text-xs">life-hub:theme</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {themes.map((t) => {
              const isActive = t.id === themeId;
              const isDefault = t.id === DEFAULT_THEME;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-3 py-1.5 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block size-3 rounded-full border border-border"
                        style={{
                          background: t.light["--primary"] ?? "transparent",
                        }}
                      />
                      {t.label}
                    </span>
                    {isActive ? (
                      <span className="text-xs text-primary">active</span>
                    ) : isDefault ? (
                      <span className="text-xs text-muted-foreground">
                        default
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
