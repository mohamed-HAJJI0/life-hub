"use client";

// Base UI Menu wrapper — minimal shadcn-style API over `@base-ui/react/menu`.
// We don't install shadcn's Radix-based dropdown; this keeps us on the
// project's `base-nova` shadcn preset (Base UI primitives).
//
// Styling: matches the rest of the app's popovers (bg-popover, border-border,
// shadow-md, rounded-md). Items mirror the sidebar's button styling so the
// dropdown reads as part of the same UI.

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

function Menu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />;
}

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

function MenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="menu-portal" {...props} />;
}

function MenuPositioner({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: MenuPrimitive.Positioner.Props) {
  return (
    <MenuPrimitive.Positioner
      data-slot="menu-positioner"
      sideOffset={sideOffset}
      align={align}
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

function MenuPopup({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Popup
      data-slot="menu-popup"
      className={cn(
        // Popover surface — same as our other popovers.
        "z-50 min-w-48 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
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

function MenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        // Match the sidebar's linkBase + linkIdle look so dropdown items
        // read as the same UI component as the sidebar nav.
        "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "text-foreground/80 outline-none",
        // Hover and focus share the same muted-background treatment.
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        // Disabled state.
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// Base UI Menu doesn't ship a Separator primitive — a plain <hr> styled
// with our border tokens does the job.
function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="menu-separator"
      role="separator"
      className={cn("my-1 border-0 border-t border-border", className)}
      {...props}
    />
  );
}

function MenuGroup({ className, ...props }: MenuPrimitive.Group.Props) {
  return (
    <MenuPrimitive.Group
      data-slot="menu-group"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

export {
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuGroup,
};
