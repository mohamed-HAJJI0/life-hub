"use client";

// Settings modal — wraps Clerk's <UserProfile /> inside our shadcn <Dialog>.
//
// Why wrap it ourselves instead of using clerk.openUserProfile():
//   1. We can add custom tabs (Theme) that wouldn't fit Clerk's built-in
//      user-profile schema (theme is a localStorage concern, not a Clerk
//      user field).
//   2. It matches the look of the rest of the app — the dialog and Clerk's
//      UI feel like one surface, not a Clerk modal inside a Clerk modal.
//
// `routing="hash"` on <UserProfile /> keeps tab switches in the URL hash
// (e.g. /#theme) instead of changing the path. That way we don't need a
// catch-all route and tab state survives the modal closing (more on that
// in the sidebar's mount logic).
//
// Reopening-stale-tab note: Clerk's hash-based <UserProfile> writes the
// current tab to `window.location.hash`. If the user closes the modal on
// /#theme and reopens it, the new instance reads the hash and lands on
// the same tab. That's usually what you want (continuity), but if we ever
// need a "reset to first tab on open", we'd clear the hash in an effect
// here. For now: leave it.
//
// Per `AGENTS.md` §5: shell sub-components live in `components/shell/`.

import { UserProfile } from "@clerk/nextjs";
import { Globe, Palette, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ThemeTabContent } from "@/components/shell/settings-tabs/theme-tab-content";
import { LanguageTabContent } from "@/components/shell/settings-tabs/language-tab-content";
import { TimezoneTabContent } from "@/components/shell/settings-tabs/timezone-tab-content";
import { useSettings } from "@/components/shell/settings-store";
import { getDictionary, t, type Locale } from "@/lib/i18n";

export function SettingsModal({
  locale,
  timezone,
}: {
  locale: Locale;
  timezone: string;
}) {
  // The open state lives in the shared settings store so the sidebar's
  // Settings button and the user menu's "Manage account" item open the
  // same modal.
  const { settingsOpen, setSettingsOpen } = useSettings();
  const dict = getDictionary(locale);

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        // sm:max-w-4xl (not just max-w-4xl) overrides shadcn's default
        // sm:max-w-sm/sm:max-w-lg on the DialogContent base classes —
        // without the sm: prefix, the base class wins and the dialog
        // stays ~384px wide, clipping Clerk's two-column layout.
        // w-full + max-w-[calc(100%-2rem)] lets it fill the viewport
        // up to ~900px, but never exceed the viewport.
        // p-0 + overflow-hidden + max-h-[90vh] gives Clerk's inner
        // scroll areas the canvas they expect. The dialog owns the
        // rounded corners — Clerk's content is clipped to it.
        className="w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl sm:rounded-xl"
        style={{ maxHeight: "90vh" }}
        // Hide the dialog's built-in close button — Clerk's <UserProfile>
        // has its own close affordance in the top-right, and stacking
        // two close buttons on top of each other overlaps badly.
        showCloseButton={false}
      >
        {/* Visually hidden DialogTitle: required by Radix (and Base UI)
            for screen readers, but Clerk's <UserProfile> has its own
            visible header. We give it a heading so the dialog is announced
            correctly. */}
        <DialogTitle className="sr-only">{t(dict, "settings.title")}</DialogTitle>

        <UserProfile
          routing="hash"
          appearance={{
            // Color tokens flow from our theme. Clerk accepts CSS var() in
            // each variable, so when the user picks a different base /
            // accent / chart / mode, every Clerk component recolors with the
            // rest of the app — no per-instance prop drilling.
            //
            // Note: var(--primary) etc. are OKLCH strings. Clerk's CSS
            // internally feeds them into its own color-mix / shade
            // derivations (hover, active, disabled). If those look off in
            // dev because OKLCH + var() is too exotic, fall back to the
            // matching key under `elements` with the same value. So far
            // light + dark are clean.
            variables: {
              colorPrimary: "var(--primary)",
              colorBackground: "var(--background)",
              colorInput: "var(--input)",
              colorInputForeground: "var(--muted-foreground)",
              colorDanger: "var(--destructive)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorForeground: "var(--foreground)",
              colorNeutral: "var(--border)",
            },
            // Layout-only overrides. No color classes here — color is
            // driven by the variables above. Every utility is prefixed with
            // `!` so it wins against Clerk's high-specificity styles.
            elements: {
              rootBox:
                "!w-full !max-w-none !shadow-none !border-0 !rounded-none",
              cardBox:
                "!w-full !max-w-none !shadow-none !border-0 !rounded-none bg-transparent text-foreground",
              card:
                "!w-full !max-w-none !shadow-none !border-0 !rounded-none bg-transparent",
              navbar: "shrink-0 border-r border-border px-2 py-4",
              scrollBox: "!w-full min-w-0",
              pageScrollBox: "!w-full min-w-0 p-4",
              page: "!w-full min-w-0",
            },
          }}
        >
          <UserProfile.Page
            label={t(dict, "settings.tab.theme")}
            labelIcon={<Palette className="size-4" />}
            url="theme"
          >
            <ThemeTabContent />
          </UserProfile.Page>
          <UserProfile.Page
            label={t(dict, "settings.tab.language")}
            labelIcon={<Globe className="size-4" />}
            url="language"
          >
            <LanguageTabContent locale={locale} />
          </UserProfile.Page>
          <UserProfile.Page
            label={t(dict, "settings.tab.timezone")}
            labelIcon={<Clock className="size-4" />}
            url="timezone"
          >
            <TimezoneTabContent locale={locale} timezone={timezone} />
          </UserProfile.Page>
        </UserProfile>
      </DialogContent>
    </Dialog>
  );
}
