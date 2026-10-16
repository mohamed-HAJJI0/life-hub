// Lobby shell — composed of:
//   - <Sidebar /> (client component) for the left nav, with collapse/expand
//   - topbar with <ThemeToggle /> + <UserButton />
//   - main content area
//
// URLs covered: / (home), /today, /settings.
// Future module hubs (e.g. /chinese-hub) are NOT wrapped by this layout —
// they're separate sub-apps (per the user's multi-app model).
//
// Protection: handled in `proxy.ts` via `auth.protect()` on the lobby
// route matcher. Unauthenticated users get redirected to /login (configured
// in .env.local). Keeping it out of this layout lets the shell stay a static
// server component (no per-request auth reads → no prerender blocking).
//
// Settings page unification:
//   The sidebar's "Settings" link and the UserButton dropdown's
//   "Manage account" item BOTH navigate to /settings (which renders
//   Clerk's <UserProfile />). We achieve that by setting
//   `userProfileUrl="/settings"` on the UserButton — this redirects
//   the built-in "Manage account" link to our route instead of Clerk's
//   hosted /user-profile path.
//
// Per `AGENTS.md` §5:
//   - The shell itself lives here; sub-components (Sidebar) live in
//     `components/shell/`.

import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/shell/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b border-border px-6">
          <ThemeToggle />
          {/*
            userProfileUrl="/settings" makes the dropdown's "Manage account"
            item open OUR /settings page (which renders <UserProfile />)
            instead of Clerk's hosted /user-profile path. One settings
            surface, two entry points.
          */}
          <UserButton userProfileUrl="/settings" />
        </header>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
