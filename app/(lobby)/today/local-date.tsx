"use client";

import { use } from "react";
import { io } from "next/cache";
import { getTodayInTz } from "@/lib/time";

/**
 * The user's local calendar date.
 *
 * The server can't know "today": `new Date()` during prerendering is an
 * unstable value, so Next refuses to bake it into a static shell.
 * `io()` suspends the prerender, so this component is excluded from the
 * shell and rendered per request instead — the date arrives in the
 * streamed HTML rather than after hydration, and it is always the current
 * date rather than whatever the build happened to be.
 */
export function LocalDate({ timezone }: { timezone: string }) {
  use(io());
  return <>{getTodayInTz(timezone).isoDate}</>;
}
