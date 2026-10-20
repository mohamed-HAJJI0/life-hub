"use client";

// Language tab — rendered inside Clerk's <UserProfile /> as a custom page
// (url="language").
//
// The language is a DB-backed account preference (it follows the user
// across devices), unlike the theme which lives in localStorage.
//
// Saving calls the server action, then `router.refresh()` so the shell
// re-renders with the new locale. The action expires this user's cached
// settings, so the refresh sees the new value immediately.
//
// Per AGENTS.md §5: each tab's content lives in its own file. Mounted in
// `settings-modal.tsx`.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
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
import { FieldLabel } from "@/components/shell/settings-tabs/field-label";
import { saveSettingsAction } from "@/lib/settings/actions";
import {
  LOCALES,
  LOCALE_LABELS,
  getDictionary,
  isLocale,
  t,
  type Locale,
} from "@/lib/i18n";

export function LanguageTabContent({ locale }: { locale: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [value, setValue] = useState<Locale>(locale);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: string | null) => {
    if (!next || !isLocale(next) || next === value) return;
    setValue(next);
    startTransition(async () => {
      await saveSettingsAction({ language: next });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <FieldLabel>{t(dict, "settings.tab.language")}</FieldLabel>
        <Select value={value} onValueChange={handleChange} disabled={pending}>
          <SelectTrigger aria-label={t(dict, "settings.tab.language")}>
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <SelectValue>
              {(v: string | null) =>
                v && isLocale(v) ? LOCALE_LABELS[v] : "—"
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
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>
                      <span className="truncate">{LOCALE_LABELS[l]}</span>
                      <SelectItemIndicator>
                        <Check className="size-3.5" />
                      </SelectItemIndicator>
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t(dict, "settings.language.description")}
        </p>
      </div>
    </div>
  );
}
