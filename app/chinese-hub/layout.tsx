import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { SettingsModal } from "@/components/shell/settings-modal";
import { ShellProviders } from "@/components/shell/shell-providers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { getUserSettings } from "@/lib/settings";
import { isModePref } from "@/lib/theme/valid-values";
import type { ThemeConfig } from "@/lib/theme/use-theme";
import { ChineseHubSidebar } from "./sidebar";
import { ChineseHubTopBar } from "./top-bar";

// Chinese Hub — an independent sub-app at the root URL `/chinese-hub`.
//
// It has its OWN shell: its own sidebar (`./sidebar.tsx`) and its own top app
// bar (`./top-bar.tsx`), both living in this app's folder. The lobby has its
// own too. The apps are independent — they share the settings modal and the
// collapsed-sidebar state, not their chrome.
//
// The Chinese module itself — add a character, review daily, track misses —
// is step 3 (see `main todolist.md` §5). This folder is its home.
//
// Protection: handled in `proxy.ts` via `auth.protect()`. Unauthenticated
// users are redirected to /login before this ever renders.

export default function ChineseHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProviders>
      {/* The shell reads the session + settings, both of which are dynamic.
          Suspense keeps that dynamic hole streamable instead of blocking
          the whole route. */}
      <Suspense fallback={<ChineseHubShellFallback />}>
        <ChineseHubShell>{children}</ChineseHubShell>
      </Suspense>
    </ShellProviders>
  );
}

async function ChineseHubShell({ children }: { children: React.ReactNode }) {
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
      <ChineseHubSidebar locale={locale} />
      <div className="flex flex-1 flex-col">
        <ChineseHubTopBar locale={locale} />
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
      <SettingsModal locale={locale} timezone={timezone} theme={theme} />
    </div>
  );
}

/** Skeleton shown while the session + settings resolve. */
function ChineseHubShellFallback() {
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
