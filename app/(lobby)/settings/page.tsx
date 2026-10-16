// /settings — placeholder. Real settings (language, timezone, theme picker
// with swatches, "reset to default", data export) land in the next iteration
// of step 1. The theme toggle in the topbar already works via localStorage.

import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your preferences for Life Hub.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" /> Coming next
          </CardTitle>
          <CardDescription>
            Language, timezone, theme picker with swatches, and a
            &quot;reset to default&quot; action all land in the next iteration.
            For now, the cycle button in the topbar already lets you switch
            themes and persists to <code className="font-mono text-xs">localStorage</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No settings yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
