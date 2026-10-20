// Home dashboard — first page after sign-in. Today it's a skeleton; the
// real dashboard (today's reviews, streak, modules) lands in a later
// milestone. The chart card is here as a temporary visual anchor for the
// theme editor so users (and reviewers) can see the live chart-1..5 colors
// while picking a theme.
//
// Per `AGENTS.md` §5: home dashboard lives at `app/(lobby)/page.tsx`
// (route group, no URL segment).
//
// Note: the shell already renders a <main> landmark, so this page uses a
// plain <div> — nesting two <main> elements is invalid HTML.

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

export default async function Home() {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "home.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "home.subtitle")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t(dict, "home.empty.title")}
            </CardTitle>
            <CardDescription>
              {t(dict, "home.empty.description")}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* TEMPORARY: visual verification of the theme editor. The chart
            bars use bg-chart-1..5 to confirm the chart color picker
            changes them live. Remove this card (or move it behind a
            dev-only route) once the theme editor is verified. */}
        <ChartPreviewCard />
      </section>
    </div>
  );
}

function ChartPreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chart preview</CardTitle>
        <CardDescription>
          <span className="text-xs">
            TEMPORARY — these bars use{" "}
            <code className="font-mono">bg-chart-1..5</code>.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-2">
          <div className="h-1/4 flex-1 rounded-t bg-chart-1" />
          <div className="h-2/4 flex-1 rounded-t bg-chart-2" />
          <div className="h-3/4 flex-1 rounded-t bg-chart-3" />
          <div className="h-2/3 flex-1 rounded-t bg-chart-4" />
          <div className="h-1/2 flex-1 rounded-t bg-chart-5" />
        </div>
      </CardContent>
    </Card>
  );
}
