"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { DialogFooter } from "@/components/ui/Dialog";
import { changePasswordAction } from "../actions";

/** `userId` absent means "change my own password" (self mode: asks for the current
 * password); present and different from the caller means an admin resetting someone
 * else's (no current-password prompt) — `changePasswordAction` decides which mode
 * actually applies server-side, this prop only controls which fields render. Deliberately
 * does not auto-close its dialog on success (unlike every other form here): a password
 * change should leave a visible confirmation rather than vanish the moment it lands. */
export function ChangePasswordForm({ userId, self = true }: { userId?: string; self?: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {userId ? <input type="hidden" name="userId" value={userId} /> : null}
      {self ? (
        <Field label="Current password">
          <Input name="currentPassword" type="password" required autoComplete="current-password" />
        </Field>
      ) : null}
      <Field label="New password">
        <Input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Password changed.</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </DialogFooter>
    </form>
  );
}
