"use client";

import { useActionState, useEffect } from "react";
import type { UserListItem } from "../repository/user.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { DialogFooter } from "@/components/ui/Dialog";
import { updateUserAction } from "../actions";
import { toast } from "@/components/ui/Toaster";

const ROLES = ["VIEWER", "OPERATOR", "ADMIN"] as const;

export function EditUserForm({
  user,
  onSuccess,
}: {
  user: UserListItem;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("User updated.");
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={user.id} />
      <Field label="Email">
        <Input name="email" type="email" defaultValue={user.email} required />
      </Field>
      <Field label="Name">
        <Input name="name" type="text" defaultValue={user.name ?? undefined} />
      </Field>
      <Field label="Role">
        <Select name="role" defaultValue={user.role}>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
