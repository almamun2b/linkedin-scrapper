"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { DialogFooter } from "@/components/ui/Dialog";
import { updateMeAction } from "../actions";

/** Self-service profile edit — no `userId` field: the action takes identity from the
 * session, never from a hidden input a client could tamper with. Does not auto-close so
 * "Saved" stays visible, matching `ChangePasswordForm`'s reasoning. */
export function UpdateMeForm({ email, name }: { email: string | null; name: string | null }) {
  const [state, formAction, pending] = useActionState(updateMeAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Email">
        <Input name="email" type="email" defaultValue={email ?? undefined} required />
      </Field>
      <Field label="Name">
        <Input name="name" type="text" defaultValue={name ?? undefined} />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Saved.</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </DialogFooter>
    </form>
  );
}
