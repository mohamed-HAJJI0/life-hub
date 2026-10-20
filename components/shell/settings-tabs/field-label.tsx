"use client";

// Shared label for the settings tabs. Same visual language as the Theme
// tab's field labels.

import type { ReactNode } from "react";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </label>
  );
}
