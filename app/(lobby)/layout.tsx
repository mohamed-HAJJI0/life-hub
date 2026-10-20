import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/shell/sidebar";
import { SettingsModal } from "@/components/shell/settings-modal";
import { ShellProviders } from "@/components/shell/shell-providers";
import { UserMenu } from "@/components/shell/user-menu";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { getUserSettings } from "@/lib/settings";

// Lobby shell — composed of:
//   - <Sidebar /> (client component) for the left nav, with collapse/expand
//   - topbar with <UserMenu /> (our Base UI menu wrapper around the user's
//     avatar — replaces Clerk's <UserButton />)
//   - <SettingsModal /> mounted ONCE at the layout level, opened by either
//     the sidebar Settings button or the user menu's "Manage account" item
//   - main content area
//
// URLs covered: / (home), /today.
// Future module hubs (e.g. /chinese-hub) are NOT wrapped by this layout —
// they're separate sub-apps (per the user's multi-app model).
//
// Theme lives in Settings → Theme (no header toggle). The Settings modal and
// the user menu can both open the same modal through `SettingsProvider`.
//
// Protection: handled in `proxy.ts` via `auth.protect()` on the lobby
// route matcher. Unauthenticated users get redirected to /login.
//
// This is a SERVER component (per `AGENTS.md` §5) so it can read the user's
// language + timezone from the database and hand them to the client
// components as props. Only the parts that need client state (Sidebar,
// UserMenu, SettingsModal) are client components.
//
// Per `AGENTS.md` §5:
//   - The shell itself lives here; sub-components (Sidebar, UserMenu,
//     SettingsModal) live in `components/shell/`.

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProviders>
      {/* The shell reads the session + settings, both of which are dynamic.
          Suspense keeps that dynamic hole streamable instead of blocking
          the whole route. */}
      <Suspense fallback={<ShellFallback />}>
        <LobbyShell>{children}</LobbyShell>
      </Suspense>
    </ShellProviders>
  );
}

async function LobbyShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  const settings = userId ? await getUserSettings(userId) : null;
  const locale: Locale = isLocale(settings?.language)
    ? settings.language
    : DEFAULT_LOCALE;
  const timezone = settings?.timezone ?? "UTC";

  return (
    <div className="flex min-h-screen">
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b border-border px-6">
          <UserMenu locale={locale} />
        </header>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
      <SettingsModal locale={locale} timezone={timezone} />
    </div>
  );
}

/** Skeleton shown while the session + settings resolve. */
function ShellFallback() {
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
