"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { createUserAction } from "../actions";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, {});

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
    >
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
      <Button type="submit" loading={pending}>
        {pending ? "Creating…" : "Create user"}
      </Button>
      {state.error ? (
        <Alert tone="error" className="w-full">
          {state.error}
        </Alert>
      ) : null}
    </form>
  );
}
