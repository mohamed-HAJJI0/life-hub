"use client";

// The collapsed state of a sidebar.
//
// Every app has its own sidebar — the lobby's and the Chinese Hub's — but they
// share ONE persisted flag: `life-hub:sidebar-collapsed` in localStorage.
// Collapsing in one app therefore stays collapsed in the other.
//
// The state is read through `useSyncExternalStore` — SSR-safe (the server
// snapshot is always expanded) and it doesn't flash on hydration the way a
// useEffect + setState would.

import { useCallback, useSyncExternalStore } from "react";

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

export function useCollapsedSidebar() {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  const toggle = useCallback(() => {
    const next = getCollapsedSnapshot() ? "0" : "1";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // best-effort persistence
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { collapsed, toggle };
}
