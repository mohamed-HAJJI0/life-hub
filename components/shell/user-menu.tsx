"use client";

// User menu — replaces Clerk's <UserButton />. Renders the user's avatar
// (Clerk profile image, initials fallback) as a trigger; the popup is a
// Base UI Menu with a header (name + email) and two items:
//
//   - Manage account → openSettings("profile")
//       Opens our shared <SettingsModal /> on the Profile tab. We close
//       the menu first and open the modal from the menu's
//       onOpenChangeComplete callback so Base UI's close animation
//       finishes before the dialog grabs focus.
//
//   - Sign out → useClerk().signOut({ redirectUrl: "/" })
//       Lands on "/", which our proxy redirects to "/login" since the
//       user is no longer authenticated.
//
// States:
//   - Loading (Clerk has not yet resolved the user): render a skeleton
//     circle so the topbar doesn't jump in size when the avatar appears.
//   - Signed out: render nothing — the lobby is protected, so this branch
//     shouldn't be reached in practice, but it's a safety net.

import * as React from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useSettings } from "@/components/shell/settings-store";
import { cn } from "@/lib/utils";
import { getDictionary, t, type Locale } from "@/lib/i18n";

function getInitials(user: {
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
}): string {
  const first = user.firstName?.trim().charAt(0) ?? "";
  const last = user.lastName?.trim().charAt(0) ?? "";
  const fromName = (first + last).toUpperCase();
  if (fromName) return fromName;
  // Fall back to the first two chars of the primary email local-part.
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  return email.slice(0, 2).toUpperCase() || "?";
}

export function UserMenu({ locale }: { locale: Locale }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const { openSettings } = useSettings();
  const dict = getDictionary(locale);

  // Track which action to run after the menu finishes closing — set in
  // onClick, executed in onOpenChangeComplete. This guarantees the menu
  // close animation completes before the dialog opens (so focus lands
  // inside the modal, not gets stuck on the now-removed menu).
  const pendingActionRef = React.useRef<null | "profile">(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Loading state — render a skeleton circle to avoid layout jump.
  if (!isLoaded) {
    return (
      <div
        aria-hidden
        className="size-8 animate-pulse rounded-full bg-muted"
      />
    );
  }

  if (!isSignedIn || !user) {
    // Lobby is protected; this branch is a safety net.
    return null;
  }

  const initials = getInitials(user);
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Account";
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  return (
    <Menu
      open={menuOpen}
      onOpenChange={(open) => {
        setMenuOpen(open);
        // Click-outside / Escape → no pending action.
        if (open) pendingActionRef.current = null;
      }}
      onOpenChangeComplete={(open) => {
        if (open) return;
        if (pendingActionRef.current === "profile") {
          pendingActionRef.current = null;
          openSettings("profile");
        }
      }}
    >
      <MenuTrigger
        aria-label={t(dict, "userMenu.open")}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar src={user.imageUrl} alt={name} initials={initials} />
      </MenuTrigger>
      <MenuPortal>
        <MenuPositioner align="end" sideOffset={8}>
          <MenuPopup>
            {/* Header — avatar + name + email. Not a menu item, just info. */}
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar
                src={user.imageUrl}
                alt={name}
                initials={initials}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>

            <MenuSeparator />

            <MenuItem
              onClick={() => {
                pendingActionRef.current = "profile";
                setMenuOpen(false);
              }}
            >
              <SettingsIcon className="size-4" />
              <span>{t(dict, "userMenu.manageAccount")}</span>
            </MenuItem>

            <MenuSeparator />

            <MenuItem
              onClick={() => {
                // Sign out + redirect. No setMenuOpen(false) needed —
                // the page is leaving, so the menu unmounts with it.
                void clerk.signOut({ redirectUrl: "/" });
              }}
            >
              <LogOut className="size-4" />
              <span>{t(dict, "userMenu.signOut")}</span>
            </MenuItem>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </Menu>
  );
}

/**
 * Round avatar with Clerk image and an initials fallback. Plain <img>
 * (not next/image) to avoid having to whitelist Clerk's image host in
 * next.config — the image is small and the fallback is always there.
 */
function Avatar({
  src,
  alt,
  initials,
  size = "md",
}: {
  src: string;
  alt: string;
  initials: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-8" : "size-8";
  const textClass = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border",
        sizeClass,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className={cn(
            "font-medium text-muted-foreground select-none",
            textClass,
          )}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
