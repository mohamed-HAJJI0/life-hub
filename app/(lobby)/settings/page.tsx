// /settings — Clerk's full account UI.
//
// This page is reached from two places, intentionally:
//   1. The sidebar's "Settings" link at the bottom of the nav.
//   2. The UserButton dropdown's "Manage account" item (via
//      `userProfileUrl="/settings"` set on the UserButton in the lobby layout).
//
// Both lead here, so the user has one place to manage identity, password,
// multi-factor auth, connected accounts, and active sessions.
//
// The Clerk `<UserProfile />` component is fully themed via the global
// `<ClerkProvider appearance={{ theme: shadcn }}>` in `app/layout.tsx` —
// no per-page appearance override needed.
//
// Future iterations will add app-level preferences (theme picker, language,
// timezone) either as a separate section below the profile or as a custom
// `<UserProfile.Page label="Preferences" />` inside Clerk's UI.
//
// `routing="hash"` keeps navigation inside the page (uses URL fragments
// like /settings#security) instead of changing the path. `routing="path"`
// would have worked too, but `hash` is friendlier when we add our own
// sections later.

import { UserProfile } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={null}>
        <UserProfile routing="hash" />
      </Suspense>
    </div>
  );
}
