"use client";

import { useActionState } from "react";
import { Button } from "@/ui/Button";
import { createProxyAction } from "../actions";

export function ProxyForm() {
  const [state, formAction, pending] = useActionState(createProxyAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
      <Field label="Label" name="label" required />
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Protocol
        <select name="protocol" defaultValue="HTTP" className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm">
          <option value="HTTP">HTTP</option>
          <option value="HTTPS">HTTPS</option>
          <option value="SOCKS5">SOCKS5</option>
        </select>
      </label>
      <Field label="Host" name="host" required />
      <Field label="Port" name="port" type="number" required />
      <Field label="Username" name="username" />
      <Field label="Password" name="password" type="password" />
      <Field label="Country" name="country" placeholder="US" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add proxy"}
      </Button>
      {state?.error ? <p className="w-full text-sm text-[--color-danger]">{state.error}</p> : null}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm"
      />
    </label>
  );
}
