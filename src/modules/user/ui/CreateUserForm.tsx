"use client";

import { useActionState } from "react";
import { Button } from "@/ui/Button";
import { createUserAction } from "../actions";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Email
        <input name="email" type="email" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Name
        <input name="name" type="text" className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Password
        <input name="password" type="password" required minLength={8} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Role
        <select name="role" defaultValue="VIEWER" className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm">
          <option value="VIEWER">VIEWER</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create user"}
      </Button>
      {state?.error ? <p className="w-full text-sm text-[--color-danger]">{state.error}</p> : null}
    </form>
  );
}
