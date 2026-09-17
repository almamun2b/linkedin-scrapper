"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { createProxyAction } from "../actions";

export function ProxyForm() {
  const [state, formAction, pending] = useActionState(createProxyAction, {});

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
    >
      <Field label="Label">
        <Input name="label" required />
      </Field>
      <Field label="Protocol">
        <Select name="protocol" defaultValue="HTTP">
          <option value="HTTP">HTTP</option>
          <option value="HTTPS">HTTPS</option>
          <option value="SOCKS5">SOCKS5</option>
        </Select>
      </Field>
      <Field label="Host">
        <Input name="host" required />
      </Field>
      <Field label="Port">
        <Input name="port" type="number" required />
      </Field>
      <Field label="Username">
        <Input name="username" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" />
      </Field>
      <Field label="Country">
        <Input name="country" placeholder="US" />
      </Field>
      <Button type="submit" loading={pending}>
        {pending ? "Adding…" : "Add proxy"}
      </Button>
      {state.error ? (
        <Alert tone="error" className="w-full">
          {state.error}
        </Alert>
      ) : null}
    </form>
  );
}
