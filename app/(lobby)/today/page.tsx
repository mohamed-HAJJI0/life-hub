// /today — placeholder for the aggregate "what's due today" view.
// Per the build plan, the real Today view (step 4 of the build) pulls due
// items from the generic scheduler at `lib/scheduler/`. This page exists
// so the sidebar link works end-to-end during step 1.
//
// The date shown is the user's *local* date, computed in their timezone
// (`lib/time/`) — the same day boundary the scheduler will use once it
// lands. Change the timezone in Settings and this updates.

import { CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";
import { getTodayInTz } from "@/lib/time";

export default async function TodayPage() {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));
  const { isoDate } = getTodayInTz(settings.timezone);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "today.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "today.subtitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isoDate} · {settings.timezone}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" /> Coming in step 4
          </CardTitle>
          <CardDescription>
            The Today view pulls due items from the generic scheduler
            (<code className="font-mono text-xs">lib/scheduler/</code>) once
            it lands. For now the page exists so the sidebar link works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t(dict, "today.empty")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
