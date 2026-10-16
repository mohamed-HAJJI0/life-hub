// /today — placeholder for the aggregate "what's due today" view.
// Per the build plan, the real Today view (step 4 of the build) pulls due
// items from the generic scheduler at `lib/scheduler/`. This page exists
// so the sidebar link works end-to-end during step 1.

import { CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">
          What needs attention across all your life areas.
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
          <p className="text-sm text-muted-foreground">No items due.</p>
        </CardContent>
      </Card>
    </div>
  );
}
