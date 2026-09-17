"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAccountAction } from "../actions";

export function DeleteAccountButton({ id, label }: { id: string; label: string }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, {});

  return (
    <div className="flex flex-col items-start gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          // Hard delete is irreversible — confirm before the action runs. The service
          // still blocks when searches/runs reference the account.
          if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="danger" size="sm" loading={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </form>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </div>
  );
}
