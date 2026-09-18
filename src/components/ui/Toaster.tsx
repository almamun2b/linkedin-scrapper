"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * The one toast surface for the project — transient success/error/warning confirmations
 * for actions that have no other feedback (e.g. a plain `<form action={...}>` row toggle
 * with no dialog to show a result in). Styled through `toastOptions.classNames` to match
 * `Alert.tsx`'s own tone language exactly (subtle fill + tinted border + saturated text,
 * no side accent bar) rather than sonner's default palette or a left-border treatment.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-md !border !shadow-popover !bg-card !border-border !text-foreground",
          title: "!text-sm !font-semibold",
          description: "!text-muted-foreground",
          success: "!bg-success-subtle !border-success/20 !text-success",
          error: "!bg-danger-subtle !border-danger/20 !text-danger",
          warning: "!bg-warning-subtle !border-warning/20 !text-warning",
        },
      }}
    />
  );
}

export { toast } from "sonner";
