import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { SettingsModal } from "@/components/shell/settings-modal";
import { ShellProviders } from "@/components/shell/shell-providers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { getUserSettings } from "@/lib/settings";
import { isModePref } from "@/lib/theme/valid-values";
import type { ThemeConfig } from "@/lib/theme/use-theme";
import { UniversitySidebar } from "./sidebar";
import { UniversityTopBar } from "./top-bar";

// Sichuan University — an independent sub-app at the root URL `/university`.
//
// It has its OWN shell: its own sidebar (`./sidebar.tsx`) and its own top app
// bar (`./top-bar.tsx`), both living in this app's folder. The lobby and the
// Chinese Hub each have their own too. The apps are independent — they share
// the settings modal and the collapsed-sidebar state, not their chrome.
//
// Protection: handled in `proxy.ts` via `auth.protect()`. Unauthenticated
// users are redirected to /login before this ever renders.

export default function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProviders>
      {/* The shell reads the session + settings, both of which are dynamic.
          Suspense keeps that dynamic hole streamable instead of blocking
          the whole route. */}
      <Suspense fallback={<UniversityShellFallback />}>
        <UniversityShell>{children}</UniversityShell>
      </Suspense>
    </ShellProviders>
  );
}

async function UniversityShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  const settings = userId ? await getUserSettings(userId) : null;
  const locale: Locale = isLocale(settings?.language)
    ? settings.language
    : DEFAULT_LOCALE;
  const timezone = settings?.timezone ?? "UTC";

  // The account-wide theme — the same one the lobby's shell uses.
  const theme: ThemeConfig = {
    base: settings?.themeBase ?? "neutral",
    accent: settings?.themeAccent ?? "default",
    chart: settings?.themeChart ?? "default",
    modePref: isModePref(settings?.themeMode) ? settings.themeMode : "system",
  };

  return (
    <div className="flex min-h-screen">
      <UniversitySidebar locale={locale} />
      <div className="flex flex-1 flex-col">
        <UniversityTopBar locale={locale} />
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
      <SettingsModal locale={locale} timezone={timezone} theme={theme} />
    </div>
  );
}

/** Skeleton shown while the session + settings resolve. */
function UniversityShellFallback() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 shrink-0 border-r border-border bg-card lg:block" />
      <div className="flex flex-1 flex-col">
        <header className="h-14 border-b border-border" />
        <main className="flex-1 p-6 sm:p-10" />
      </div>
    </div>
  );
}
