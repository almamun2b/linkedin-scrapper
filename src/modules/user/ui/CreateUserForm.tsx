"use client";

import { useActionState, useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { DialogFooter } from "@/components/ui/Dialog";
import { createUserAction } from "../actions";
import { toast } from "@/components/ui/Toaster";

export function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(createUserAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("User created.");
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Name">
        <Input name="name" type="text" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required minLength={8} />
      </Field>
      <Field label="Role">
        <Select name="role" defaultValue="VIEWER">
          <option value="VIEWER">VIEWER</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </Select>
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}
