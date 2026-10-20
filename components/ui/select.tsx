"use client";

// Base UI Select wrapper — minimal shadcn-style API over `@base-ui/react/select`.
// We don't install shadcn's Radix-based dropdown; this keeps us on the
// project's `base-nova` shadcn preset (Base UI primitives).
//
// Why a Select (and not a Menu): Select is the right primitive for "pick one
// from a list of N options" — it ships keyboard support, type-ahead, ARIA
// combobox semantics, and a hidden <input> for forms. Menu is for actions.
//
// Styling: matches the rest of the app's popovers (bg-popover, border-border,
// shadow-md, rounded-md) — same surface as `components/ui/menu.tsx` so the
// dropdowns read as one family.
//
// Keyboard: Base UI's Select gives us arrow keys, type-ahead, Enter, Escape
// for free. We don't add wrappers.

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";

function Select({ ...props }: SelectPrimitive.Root.Props<string, false>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        // Field surface — h-9 to match other inputs / buttons, gap-2 to give
        // the trigger content breathing room.
        "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm",
        // Foreground + placeholder treatment.
        "text-foreground outline-none",
        // Focus ring.
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Disabled.
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Truncation safety.
        "overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 truncate text-left", className)}
      {...props}
    />
  );
}

function SelectIcon({
  className,
  ...props
}: SelectPrimitive.Icon.Props) {
  return (
    <SelectPrimitive.Icon
      data-slot="select-icon"
      className={cn("shrink-0 text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectPortal({ ...props }: SelectPrimitive.Portal.Props) {
  return <SelectPrimitive.Portal data-slot="select-portal" {...props} />;
}

function SelectPositioner({
  className,
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  ...props
}: SelectPrimitive.Positioner.Props) {
  return (
    <SelectPrimitive.Positioner
      data-slot="select-positioner"
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      className={cn("z-[60] outline-none", className)}
      {...props}
    />
  );
}

function SelectPopup({ className, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Popup
      data-slot="select-popup"
      className={cn(
        // Popover surface — same as our Menu popup.
        "z-[60] max-h-72 min-w-48 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        // Subtle open/close motion.
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        // Sizing.
        "p-1 text-sm",
        className,
      )}
      {...props}
    />
  );
}

function SelectList({ className, ...props }: SelectPrimitive.List.Props) {
  return (
    <SelectPrimitive.List
      data-slot="select-list"
      className={cn("flex flex-col gap-0.5 outline-none", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none transition-colors",
        "text-foreground/80",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Item>
  );
}

function SelectItemIndicator({
  className,
  ...props
}: SelectPrimitive.ItemIndicator.Props) {
  return (
    <SelectPrimitive.ItemIndicator
      data-slot="select-item-indicator"
      className={cn("ml-auto inline-flex size-3.5 items-center justify-center text-foreground", className)}
      {...props}
    />
  );
}

function SelectItemText({ ...props }: SelectPrimitive.ItemText.Props) {
  return <SelectPrimitive.ItemText data-slot="select-item-text" {...props} />;
}

function SelectGroup({ ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectGroupLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn(
        "px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectList,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
};
