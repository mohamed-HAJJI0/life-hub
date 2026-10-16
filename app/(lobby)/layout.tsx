// Lobby shell — composed of:
//   - <Sidebar /> (client component) for the left nav, with collapse/expand
//   - topbar with <ThemeToggle /> + <UserButton />
//   - main content area
//
// URLs covered: / (home), /today.
// Future module hubs (e.g. /chinese-hub) are NOT wrapped by this layout —
// they're separate sub-apps (per the user's multi-app model).
//
// Protection: handled in `proxy.ts` via `auth.protect()` on the lobby
// route matcher. Unauthenticated users get redirected to /login (configured
// in .env.local). Keeping it out of this layout lets the shell stay a static
// server component (no per-request auth reads → no prerender blocking).
//
// Settings is NOT a page — it's a floating modal. Clerk's <UserProfile />
// is rendered internally by the <UserButton /> in the topbar (the dropdown's
// "Manage account" item opens it). The sidebar's Settings button triggers
// the SAME modal via useClerk().openUserProfile(). No URL, no /settings route.
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
          <UserButton />
        </header>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
