"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDialogBehavior } from "@/lib/useDialogBehavior";
import { Button } from "./Button";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  children: ReactNode;
}

/**
 * The one reusable modal for the project (every create/edit/confirm flow uses this instead
 * of a full page or an always-visible inline bar). Portaled to `document.body` so it can sit
 * above the app shell regardless of where it's triggered from; `z-50` clears the mobile
 * drawer's `z-40` (the only other overlay in the codebase, `Sidebar.tsx`).
 */
export function Dialog({ open, onClose, title, description, size = "md", children }: DialogProps) {
  const { panelRef } = useDialogBehavior(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  // `open` starts false in every caller and only flips true from a client-side event
  // handler, never during the initial (server) render — so `document.body` is always
  // available by the time this actually portals; no separate "have we mounted" gate needed.
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col rounded-lg border border-border bg-popover shadow-popover",
          SIZE_CLASSES[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-popover-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close dialog"
            onClick={onClose}
            className="-mt-1 -mr-1 size-7 shrink-0"
          >
            <X aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "-mx-4 mt-4 -mb-4 flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
