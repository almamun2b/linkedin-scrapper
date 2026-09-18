"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { IconAction } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toaster";
import { deleteAccountAction } from "../actions";

function historyLine(searches: number, runs: number): string {
  if (searches === 0 && runs === 0) return "It has no searches or runs.";
  const parts = [
    searches > 0 ? `${searches} search${searches === 1 ? "" : "es"}` : null,
    runs > 0 ? `${runs} run${runs === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return `Its ${parts.join(" and ")} will also be deleted.`;
}

export function DeleteAccountButton({
  id,
  label,
  searches,
  runs,
}: {
  id: string;
  label: string;
  searches: number;
  runs: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <IconAction
        icon={<Trash2 aria-hidden="true" className="size-4" />}
        label="Delete account"
        tone="danger"
        onClick={() => { setOpen(true); }}
      />
      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id);
            const result = await deleteAccountAction({}, formData);
            if (result.error) {
              setError(result.error);
            } else {
              toast.success("Account deleted.");
              setOpen(false);
            }
          });
        }}
        title={`Delete "${label}"?`}
        body={
          <>
            {historyLine(searches, runs)} Leads are kept. This cannot be undone.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
        confirmLabel="Delete account"
        pending={pending}
      />
    </>
  );
}
