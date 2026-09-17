"use client";

import { useActionState } from "react";
import { Button } from "@/ui/Button";
import { createAccountAction } from "../actions";

export function AccountForm() {
  const [state, formAction, pending] = useActionState(createAccountAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4 max-w-md">
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Label
        <input name="label" defaultValue="primary" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        LinkedIn email
        <input name="email" type="email" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        LinkedIn password
        <input name="password" type="password" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Timezone (IANA id)
        <input name="timezone" defaultValue="UTC" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add LinkedIn account"}
      </Button>
      {state?.error ? <p className="text-sm text-[--color-danger]">{state.error}</p> : null}
    </form>
  );
}
