"use client";

// Lobby sidebar — collapsible shell chrome. Lives in `components/shell/`
// (per AGENTS.md §5: shell sub-components live here, the layout itself
// stays in `app/(lobby)/layout.tsx`).
//
// Layout (top → bottom):
//   - Logo block ("LH" badge + "Life Hub" / "Lobby" label; label hidden when collapsed)
//   - Top nav: Home, Today
//   - Spacer (`flex-1`) — pushes the bottom group down
//   - Bottom group:
//       - Settings link (per the user's request: Settings sits at the bottom)
//       - Collapse/expand toggle button
//
// Important: the nav items are defined HERE (a client component), not passed
// in from the server-component layout. That's because icon components are
// `forwardRef` objects with a `render` function, which isn't serializable
// across the server/client boundary. The layout just renders `<Sidebar />`
// with no props.
//
// State:
//   - `collapsed` lives in localStorage (`life-hub:sidebar-collapsed`) so it
//     survives page navigations and reloads. SSR-safe: starts as `false`,
//     hydrates from localStorage in `useEffect`.
//   - Width: `w-64` expanded, `w-16` collapsed, with a 200ms `transition-[width]`
//     so the collapse is smooth instead of jumpy.
//
// When collapsed, the link labels disappear and each link keeps a `title=`
// attribute so browser-native tooltips cover the labels. (Avoids pulling in
// shadcn `Tooltip` until we actually need it elsewhere.)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const TOP_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: CalendarDays },
];

const STORAGE_KEY = "life-hub:sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // best-effort persistence
  }
}

export function Sidebar() {
  // SSR-safe default: expanded. Hydrate from localStorage after mount.
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const clerk = useClerk();

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      writeCollapsed(next);
      return next;
    });
  };

  const linkBase = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    collapsed && "justify-center px-0",
  );
  const linkActive = "bg-muted text-foreground";
  const linkIdle = "text-foreground/80 hover:bg-muted hover:text-foreground";

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 overflow-hidden px-4 py-5">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          LH
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">
              Life Hub
            </p>
            <p className="text-xs text-muted-foreground">Lobby</p>
          </div>
        )}
      </div>
      <Separator />

      {/* Top nav */}
      <nav className="flex flex-col gap-1 p-3">
        {TOP_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(linkBase, isActive(item.href) ? linkActive : linkIdle)}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Spacer pushes the bottom group to the bottom */}
      <div className="flex-1" />

      {/* Bottom group: Settings (opens Clerk <UserProfile /> as a floating modal)
          + collapse toggle. Settings is NOT a page — Clerk's <UserProfile />
          component is rendered internally by the <UserButton /> in the topbar
          (via the "Manage account" item) and we trigger the same modal from
          here via useClerk().openUserProfile(). No URL state. */}
      <div className="flex flex-col gap-1 p-3">
        <Separator className="mb-2" />
        <button
          type="button"
          onClick={() => clerk.openUserProfile()}
          title={collapsed ? "Settings" : undefined}
          aria-label="Open settings"
          className={cn(linkBase, linkIdle)}
        >
          <SettingsIcon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            linkBase,
            "text-foreground/60 hover:text-foreground",
            "border border-transparent",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4 shrink-0" />
          ) : (
            <ChevronsLeft className="size-4 shrink-0" />
          )}
          {!collapsed && <span className="truncate">Collapse</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 text-xs text-muted-foreground">
          v0.1 · step 1 of the build
        </div>
      )}
    </aside>
  );
}
