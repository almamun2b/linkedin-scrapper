"use client";

import { useActionState, useEffect } from "react";
import type { ProxyListItem } from "../repository/proxy.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { DialogFooter } from "@/components/ui/Dialog";
import { createProxyAction, updateProxyAction } from "../actions";
import { toast } from "@/components/ui/Toaster";

/** One form for both create and edit — `proxy` present means edit. Password is always
 * optional on edit (blank keeps the sealed value); required on create. */
export function ProxyForm({
  proxy,
  onSuccess,
}: {
  proxy?: ProxyListItem;
  onSuccess?: () => void;
}) {
  const action = proxy ? updateProxyAction : createProxyAction;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(proxy ? "Proxy updated." : "Proxy added.");
      onSuccess?.();
    }
  }, [state, onSuccess, proxy]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {proxy ? <input type="hidden" name="id" value={proxy.id} /> : null}
      <Field label="Label">
        <Input name="label" defaultValue={proxy?.label} required={!proxy} />
      </Field>
      <Field label="Protocol">
        <Select name="protocol" defaultValue={proxy?.protocol ?? "HTTP"}>
          <option value="HTTP">HTTP</option>
          <option value="HTTPS">HTTPS</option>
          <option value="SOCKS5">SOCKS5</option>
        </Select>
      </Field>
      <Field label="Host">
        <Input name="host" defaultValue={proxy?.host} required={!proxy} />
      </Field>
      <Field label="Port">
        <Input name="port" type="number" defaultValue={proxy?.port} required={!proxy} />
      </Field>
      <Field label="Username">
        <Input name="username" defaultValue={proxy?.username ?? undefined} />
      </Field>
      <Field label="Password" hint={proxy ? "Leave blank to keep the current password." : undefined}>
        <Input name="password" type="password" />
      </Field>
      <Field label="Country">
        <Input name="country" placeholder="US" defaultValue={proxy?.country ?? undefined} />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : proxy ? "Save proxy" : "Add proxy"}
        </Button>
      </DialogFooter>
    </form>
  );
}
