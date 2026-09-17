"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
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
  const [state, formAction, pending] = useActionState(deleteUserAction, {});

  return (
    <div className="flex flex-col items-start gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          // Hard delete is irreversible — confirm before the action runs. The
          // service still blocks self-delete and deleting the last admin.
          if (!window.confirm(`Delete "${email}"? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={id} />
        <Button
          type="submit"
          variant="danger"
          size="sm"
          loading={pending}
          disabled={disabled}
          title={disabled ? disabledReason : `Delete ${email} permanently`}
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </form>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </div>
  );
}
