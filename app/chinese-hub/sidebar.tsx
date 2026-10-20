"use client";

// The Chinese Hub's OWN sidebar.
//
// Every app has its own shell. The lobby's lives in `app/(lobby)/layout.tsx`
// + `components/shell/sidebar.tsx`; this one lives in the app's own folder.
// The two share only the collapsed state (`useCollapsedSidebar`) and the
// settings modal — the nav is this app's own.
//
// Layout (top → bottom):
//   - Brand slot: a GO-BACK button to the lobby, in place of a logo
//   - Top nav: this app's own sections
//   - Spacer (`flex-1`) — pushes the bottom group down
//   - Bottom group: Settings + collapse/expand toggle
//
// The nav is hardcoded for now. Step 2 replaces it with this app's own module
// registry (`app/chinese-hub/modules/_registry.ts`) — see
// plans/2026-10-20_1645-module-registry-and-per-app-modules.md.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Languages,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/shell/settings-store";
import { useCollapsedSidebar } from "@/components/shell/use-collapsed";
import { getDictionary, t, type Locale } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function ChineseHubSidebar({ locale }: { locale: Locale }) {
  const { collapsed, toggle } = useCollapsedSidebar();
  const { openSettings } = useSettings();
  const pathname = usePathname();
  const dict = getDictionary(locale);

  // This app's own nav. It grows with the Chinese module (step 3).
  const nav: NavItem[] = [
    {
      href: "/chinese-hub",
      label: t(dict, "chinese.nav.overview"),
      icon: Languages,
    },
  ];

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
      aria-label={t(dict, "chinese.nav.primary")}
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand slot — a go-back button to the lobby, where the lobby shows
          its logo badge. */}
      <div className="flex items-center gap-2 overflow-hidden px-4 py-5">
        <Link
          href="/"
          title={collapsed ? t(dict, "nav.back") : undefined}
          aria-label={t(dict, "nav.back")}
          className="group flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/50 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
            <ArrowLeft className="size-4" />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {t(dict, "nav.back")}
            </span>
          )}
        </Link>
      </div>
      <Separator />

      {/* This app's nav */}
      <nav className="flex flex-col gap-1 p-3">
        {nav.map((item) => {
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

      {/* Bottom group: Settings (opens the shared <SettingsModal />, which
          wraps Clerk's <UserProfile> with our shadcn <Dialog> + custom
          tabs) + collapse toggle. Settings is NOT a page — no URL change. */}
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
