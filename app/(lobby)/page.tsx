// Home dashboard — first page after sign-in. Today it's a skeleton; the
// real dashboard (today's reviews, streak, modules) lands in a later
// milestone (step 2 — see plans/2026-10-20_1645-module-registry-and-per-app-modules.md).
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
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t(dict, "home.subtitle")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(dict, "today.title")}</CardTitle>
            <CardDescription>{t(dict, "today.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t(dict, "today.empty")}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
