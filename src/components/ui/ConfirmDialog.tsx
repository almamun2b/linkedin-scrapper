"use client";

import type { ReactNode } from "react";
import { Dialog, DialogFooter } from "./Dialog";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  body: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
}

/**
 * The one confirm dialog for the project — replaces every `window.confirm()` (previously
 * `DeleteAccountButton.tsx`, `DeleteUserButton.tsx`). `body` takes a node rather than a
 * string so a caller can show real counts ("3 searches and 47 runs") instead of a generic
 * warning.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  pending,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-foreground">{body}</p>
      <DialogFooter>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
