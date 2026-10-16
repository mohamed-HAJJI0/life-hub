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
import { Palette } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ThemeTabContent } from "@/components/shell/settings-tabs/theme-tab-content";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Wide enough for Clerk's two-column layout (left nav + content).
        // No internal padding (p-0) — Clerk's own layout handles spacing.
        // max-h + overflow-hidden so the inner scroll areas work as Clerk
        // expects (nav scrolls independently of content).
        className="max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-xl"
        style={{ maxHeight: "min(90vh, 900px)" }}
        showCloseButton={true}
      >
        {/* Visually hidden DialogTitle: required by Radix (and Base UI)
            for screen readers, but Clerk's <UserProfile> has its own
            visible header. We give it a heading so the dialog is announced
            correctly. */}
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <UserProfile
          routing="hash"
          appearance={{
            // Strip Clerk's outer card chrome so the dialog and the Clerk
            // UI are one surface (no double border, no fixed width, no
            // shadow on top of the dialog's shadow).
            elements: {
              rootBox: "w-full",
              cardBox:
                "w-full shadow-none border-0 bg-transparent text-foreground",
              card: "shadow-none border-0 bg-transparent",
              navbar: "border-r border-border",
              pageScrollBox: "p-6",
            },
          }}
        >
          <UserProfile.Page
            label="Theme"
            labelIcon={<Palette className="size-4" />}
            url="theme"
          >
            <ThemeTabContent />
          </UserProfile.Page>
        </UserProfile>
      </DialogContent>
    </Dialog>
  );
}
