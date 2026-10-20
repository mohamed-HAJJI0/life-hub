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
// The nav list is still hardcoded. Step 2 replaces it with the lobby's
// module registry — see plans/2026-10-20_1645-module-registry-and-per-app-modules.md.
//
// State:
//   - `collapsed` lives in localStorage (`life-hub:sidebar-collapsed`) so it
//     survives page navigations and reloads. Read through
//     `useSyncExternalStore`, which is SSR-safe (server snapshot = expanded)
//     and doesn't flash on hydration the way a useEffect + setState would.
//   - Width: `w-64` expanded, `w-16` collapsed, with a 200ms `transition-[width]`
//     so the collapse is smooth instead of jumpy.
//
// When collapsed, the link labels disappear and each link keeps a `title=`
// attribute so browser-native tooltips cover the labels. (Avoids pulling in
// shadcn `Tooltip` until we actually need it elsewhere.)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
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
import { useSettings } from "@/components/shell/settings-store";
import { getDictionary, t, type Locale } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const STORAGE_KEY = "life-hub:sidebar-collapsed";
const CHANGE_EVENT = "life-hub:sidebar-collapsed-changed";

function subscribeCollapsed(onStoreChange: () => void) {
  // `storage` fires in other tabs; CHANGE_EVENT fires in this one.
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

// Returns a boolean primitive, so the snapshot is stable between calls.
function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// Server render: always expanded. The real value arrives after hydration.
function getCollapsedServerSnapshot(): boolean {
  return false;
}

export function Sidebar({ locale }: { locale: Locale }) {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const { openSettings } = useSettings();
  const pathname = usePathname();
  const dict = getDictionary(locale);

  const topNav: NavItem[] = [
    { href: "/", label: t(dict, "nav.home"), icon: Home },
    { href: "/today", label: t(dict, "nav.today"), icon: CalendarDays },
  ];

  const toggle = useCallback(() => {
    const next = getCollapsedSnapshot() ? "0" : "1";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // best-effort persistence
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

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
      aria-label={t(dict, "nav.primary")}
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
              {t(dict, "app.name")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(dict, "app.lobby")}
            </p>
          </div>
        )}
      </div>
      <Separator />

      {/* Top nav */}
      <nav className="flex flex-col gap-1 p-3">
        {topNav.map((item) => {
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

      {/* Bottom group: Settings (opens our <SettingsModal />, which wraps
          Clerk's <UserProfile /> with our shadcn <Dialog> + custom tabs)
          + collapse toggle. Settings is NOT a page — no URL change. */}
      <div className="flex flex-col gap-1 p-3">
        <Separator className="mb-2" />
        <button
          type="button"
          onClick={() => openSettings()}
          title={collapsed ? t(dict, "nav.settings") : undefined}
          aria-label={t(dict, "nav.settings")}
          className={cn(linkBase, linkIdle)}
        >
          <SettingsIcon className="size-4 shrink-0" />
          {!collapsed && (
            <span className="truncate">{t(dict, "nav.settings")}</span>
          )}
        </button>
        <button
          type="button"
          onClick={toggle}
          title={
            collapsed
              ? t(dict, "nav.expand")
              : t(dict, "nav.collapse")
          }
          aria-label={
            collapsed ? t(dict, "nav.expand") : t(dict, "nav.collapse")
          }
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
          {!collapsed && (
            <span className="truncate">{t(dict, "nav.collapse")}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
