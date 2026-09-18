"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { IconAction } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toaster";
import { deleteUserAction } from "../actions";

export function DeleteUserButton({
  id,
  email,
  disabled = false,
  disabledReason,
}: {
  id: string;
  email: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <IconAction
        icon={<Trash2 aria-hidden="true" className="size-4" />}
        label="Delete user"
        tone="danger"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => { setOpen(true); }}
      />
      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("userId", id);
            const result = await deleteUserAction({}, formData);
            if (result.error) {
              setError(result.error);
            } else {
              toast.success("User deleted.");
              setOpen(false);
            }
          });
        }}
        title={`Delete "${email}"?`}
        body={
          <>
            This cannot be undone.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
        confirmLabel="Delete user"
        pending={pending}
      />
    </>
  );
}
