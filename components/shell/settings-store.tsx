"use client";

// Shared state for the settings modal — both the sidebar Settings button
// and the top-bar user menu ("Manage account" item) need to open it, so
// we lift the open state out of the sidebar into a tiny context.
//
// `openSettings(tab?)`:
//   - Without an argument: open the modal and let whatever tab was last
//     remembered (via Clerk's hash routing) be selected.
//   - With `"profile"`: open on the Profile tab. We clear the URL hash
//     with `history.replaceState` BEFORE setting open=true so Clerk reads
//     a clean hash on first render and lands on its first tab (Profile).
//     Using replaceState (not location.hash = "") avoids adding a history
//     entry and avoids the browser's "scroll to fragment" jump.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SettingsTab = "profile" | "theme" | "language" | "timezone";

type SettingsContextValue = {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  openSettings: (tab?: SettingsTab) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = useCallback((tab?: SettingsTab) => {
    if (tab === "profile") {
      // Clear the URL hash so Clerk's hash-routed <UserProfile /> reads
      // a clean hash on first render and lands on its first tab.
      // history.replaceState is the safe way — no history entry, no
      // scroll jump, no remount.
      const cleanUrl =
        window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }
    setSettingsOpen(true);
  }, []);

  const value = useMemo(
    () => ({ settingsOpen, setSettingsOpen, openSettings }),
    [settingsOpen, openSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>");
  }
  return ctx;
}
