// Lobby shell — sidebar + topbar that wraps every page in `app/(lobby)/*`.
// URLs covered: / (home), /today, /settings.
// Future module hubs (e.g. /chinese-hub) are NOT wrapped by this layout —
// they're separate sub-apps (per the user's multi-app model).
//
// Protection: handled in `proxy.ts` via `auth.protect()` on the lobby
// route matcher. Unauthenticated users get redirected to /login (configured
// in .env.local). Keeping it out of this layout lets the shell stay a static
// server component (no per-request auth reads → no prerender blocking).
//
// Per `AGENTS.md` §5:
//   - The shell lives here (sidebar + topbar) using shadcn primitives.
//   - Theme toggle (cycle button) and Clerk's UserButton sit in the topbar.
//   - Auth is owned by Clerk; this file never reaches into Clerk internals.

import { UserButton } from "@clerk/nextjs";
import { CalendarDays, Home, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr]">
      <aside className="flex flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            LH
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Life Hub</p>
            <p className="text-xs text-muted-foreground">Lobby</p>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 text-xs text-muted-foreground">
          v0.1 · step 1 of the build
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b border-border px-6">
          <ThemeToggle />
          <UserButton />
        </header>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
