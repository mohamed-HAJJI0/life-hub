"use client";

// Keeps Clerk's hash-router state alive across Next.js router updates.
//
// Clerk's <UserProfile routing="hash"> stores the active tab in the URL
// fragment (e.g. "#/theme"). Next.js's HistoryUpdater calls
// `history.replaceState(state, "", canonicalUrl)` after every render — and
// that canonical URL never contains the fragment, because browsers do not
// send it to the server, so Next never learns that Clerk set it.
//
// Clerk patches `history.replaceState` globally to notice URL changes, so it
// immediately re-reads the (now empty) fragment, the router path collapses
// back to its base, and the profile bounces to its first page. That is why
// saving any setting kicks the settings modal back to the first tab.
//
// This keeps the fragment alive across those calls — but ONLY for same-path
// updates, so a real navigation to another route still clears it.

import { useEffect } from "react";

export function useHashGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const preserveHash = (
      url: string | URL | null | undefined,
    ): string | URL | null | undefined => {
      if (!url) return url;
      const next = new URL(String(url), window.location.href);
      // The caller is setting its own fragment — leave it alone.
      if (next.hash) return url;
      // Nothing to preserve.
      if (!window.location.hash) return url;
      // A real navigation to another path — the fragment should go.
      if (next.pathname !== window.location.pathname) return url;
      next.hash = window.location.hash;
      return next.href;
    };

    const patchedPushState: typeof history.pushState = function (
      this: History,
      data,
      unused,
      url,
    ) {
      return originalPushState.call(this, data, unused, preserveHash(url));
    };

    const patchedReplaceState: typeof history.replaceState = function (
      this: History,
      data,
      unused,
      url,
    ) {
      return originalReplaceState.call(this, data, unused, preserveHash(url));
    };

    history.pushState = patchedPushState;
    history.replaceState = patchedReplaceState;

    return () => {
      // Only restore if nobody wrapped us in the meantime. Clerk patches
      // `history.replaceState` itself, and if it wrapped our version then
      // unwrapping would silently disable its URL observer.
      if (history.pushState === patchedPushState) {
        history.pushState = originalPushState;
      }
      if (history.replaceState === patchedReplaceState) {
        history.replaceState = originalReplaceState;
      }
    };
  }, [active]);
}
