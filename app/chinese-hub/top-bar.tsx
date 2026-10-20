// The Chinese Hub's OWN top app bar.
//
// It matches the lobby's top bar: a bordered h-14 bar with the avatar / user
// menu on the right. The user menu opens the shared settings modal, so the
// account, theme, language and timezone settings work exactly as they do in
// the lobby — the apps have their own chrome, not their own settings.

import { UserMenu } from "@/components/shell/user-menu";
import type { Locale } from "@/lib/i18n";

export function ChineseHubTopBar({ locale }: { locale: Locale }) {
  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b border-border px-6">
      <UserMenu locale={locale} />
    </header>
  );
}
