"use client";

// Lobby shell — composed of:
//   - <Sidebar /> (client component) for the left nav, with collapse/expand
//   - topbar with <ThemeToggle /> + <UserMenu /> (our Base UI menu wrapper
//     around the user's avatar — replaces Clerk's <UserButton />)
//   - <SettingsModal /> mounted ONCE at the layout level, opened by either
//     the sidebar Settings button or the user menu's "Manage account" item
//   - main content area
//
// URLs covered: / (home), /today.
// Future module hubs (e.g. /chinese-hub) are NOT wrapped by this layout —
// they're separate sub-apps (per the user's multi-app model).
//
// Protection: handled in `proxy.ts` via `auth.protect()` on the lobby
// route matcher. Unauthenticated users get redirected to /login.
//
// Per `AGENTS.md` §5:
//   - The shell itself lives here; sub-components (Sidebar, UserMenu,
//     SettingsModal) live in `components/shell/`.

import { Sidebar } from "@/components/shell/sidebar";
import { SettingsModal } from "@/components/shell/settings-modal";
import {
  SettingsProvider,
  useSettings,
} from "@/components/shell/settings-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <LobbyShell>{children}</LobbyShell>
    </SettingsProvider>
  );
}

function LobbyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b border-border px-6">
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
      <SettingsModalMount />
    </div>
  );
}

// SettingsModal needs the open state from the shared store. Rendered here
// (not in the sidebar) so both the sidebar and the user menu can trigger it
// through the same store. The dialog uses a fixed-position portal, so its
// mount point doesn't affect layout.
function SettingsModalMount() {
  const { settingsOpen, setSettingsOpen } = useSettings();
  return (
    <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
  );
}
