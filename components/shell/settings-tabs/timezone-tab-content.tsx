"use client";

// Timezone tab — rendered inside Clerk's <UserProfile /> as a custom page
// (url="timezone").
//
// The timezone is a DB-backed account preference. It decides where the day
// boundary sits, which is what "due today" and daily streaks are measured
// against — see `lib/time/`.
//
// "Auto-detect" reads the browser's zone and stores it as a concrete IANA
// id. We store the resolved zone rather than a sentinel, so the value stays
// correct even if the user later travels (or uses another device) — they
// can re-run auto-detect any time.
//
// Per AGENTS.md §5: each tab's content lives in its own file. Mounted in
// `settings-modal.tsx`.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clock, LocateFixed } from "lucide-react";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
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
import { FieldLabel } from "@/components/shell/settings-tabs/field-label";
import { saveSettingsAction } from "@/lib/settings/actions";
import { getDictionary, t, type Locale } from "@/lib/i18n";
import {
  TIMEZONE_IDS,
  detectTimezone,
  timezoneLabel,
  timezoneOffsetLabel,
  timezoneRegion,
} from "@/lib/time";

const AUTO_DETECT = "__auto__";

export function TimezoneTabContent({
  locale,
  timezone,
}: {
  locale: Locale;
  timezone: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [value, setValue] = useState(timezone);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: string | null) => {
    if (!next) return;
    // "Auto-detect" resolves to the browser's zone before it is stored.
    const resolved = next === AUTO_DETECT ? detectTimezone() : next;
    if (resolved === value) return;
    setValue(resolved);
    startTransition(async () => {
      await saveSettingsAction({ timezone: resolved });
      router.refresh();
    });
  };

  // Group the curated list by region so the dropdown is navigable.
  const grouped = TIMEZONE_IDS.reduce<Record<string, string[]>>((acc, tz) => {
    const region = timezoneRegion(tz);
    (acc[region] ??= []).push(tz);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <FieldLabel>{t(dict, "settings.tab.timezone")}</FieldLabel>
        <Select value={value} onValueChange={handleChange} disabled={pending}>
          <SelectTrigger aria-label={t(dict, "settings.tab.timezone")}>
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <SelectValue>
              {(v: string | null) => (v ? timezoneLabel(v) : "—")}
            </SelectValue>
            <SelectIcon>
              <ChevronDown className="size-3.5" />
            </SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList>
                  <SelectItem value={AUTO_DETECT}>
                    <LocateFixed className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {t(dict, "settings.timezone.autoDetect")}
                    </span>
                    <SelectItemIndicator>
                      <Check className="size-3.5" />
                    </SelectItemIndicator>
                  </SelectItem>
                  {Object.entries(grouped).map(([region, zones]) => (
                    <SelectGroup key={region}>
                      <SelectGroupLabel>{region}</SelectGroupLabel>
                      {zones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          <span className="truncate">{timezoneLabel(tz)}</span>
                          <span className="ml-auto pl-3 text-[10px] text-muted-foreground">
                            {timezoneOffsetLabel(tz)}
                          </span>
                          <SelectItemIndicator>
                            <Check className="size-3.5" />
                          </SelectItemIndicator>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t(dict, "settings.timezone.description")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(dict, "settings.timezone.current")}: {value} (
          {timezoneOffsetLabel(value)})
        </p>
      </div>
    </div>
  );
}
