// Temporary smoke test for the theme system.
//
// Replaced in step 1 of the build (auth + shell + settings — see
// `plans/2026-10-16_1608-project-plan-and-structure.md`). Until then, this
// page exists to verify end-to-end:
//   - shadcn `Button` / `Card` / `Separator` components render
//   - `<ThemeToggle />` cycles through all 4 themes
//   - The chosen theme persists across reloads (localStorage `life-hub:theme`)
//   - No FOUC on reload (no-FOUC <script> applies the theme before paint)
//
// Per `AGENTS.md` §5: home dashboard lives in `app/(app)/page.tsx` once the
// authenticated shell exists. For now it stays at `app/page.tsx` (no auth
// yet — step 1 will add the `(app)` route group).

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEMES, DEFAULT_THEME } from "@/lib/theme/themes";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Life Hub</h1>
          <p className="text-sm text-muted-foreground">
            Theme system is live. Step 1 of the build (auth + shell + settings) comes next.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Separator />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4" /> Active theme
            </CardTitle>
            <CardDescription>
              Click the palette icon in the header to cycle. Your choice is
              saved in <code className="font-mono text-xs">localStorage</code>{" "}
              under the key <code className="font-mono text-xs">life-hub:theme</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {THEMES.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-1.5"
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
                  {t.id === DEFAULT_THEME ? (
                    <span className="text-xs text-muted-foreground">default</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What works</CardTitle>
            <CardDescription>
              Pieces of the foundation this page exercises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>• shadcn <code className="font-mono text-xs">Button</code> + <code className="font-mono text-xs">Card</code> + <code className="font-mono text-xs">Separator</code></li>
              <li>• Runtime theme system (<code className="font-mono text-xs">lib/theme/</code>)</li>
              <li>• localStorage persistence under <code className="font-mono text-xs">life-hub:theme</code></li>
              <li>• No-FOUC inline <code className="font-mono text-xs">&lt;script&gt;</code> in <code className="font-mono text-xs">&lt;head&gt;</code></li>
              <li>• <code className="font-mono text-xs">lucide-react</code> icons</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Default</Button>
              <Button size="sm" variant="secondary">Secondary</Button>
              <Button size="sm" variant="outline">Outline</Button>
              <Button size="sm" variant="ghost">Ghost</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
