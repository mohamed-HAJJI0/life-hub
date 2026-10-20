"use client";

// Client boundary for the shell.
//
// React context providers cannot be created in a server component, and the
// shell needs one: the Sidebar's "Settings" button and the UserMenu's
// "Manage account" item both open the same `<SettingsModal />`, so they
// share the open state.
//
// The shell itself lives in `app/(lobby)/layout.tsx` (a server component —
// it reads the user's settings from the database). This file is only the
// client island that carries the context.

import type { ReactNode } from "react";
import { SettingsProvider } from "./settings-store";

export function ShellProviders({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
