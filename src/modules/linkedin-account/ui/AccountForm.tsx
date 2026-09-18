"use client";

import { useActionState, useEffect } from "react";
import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { DialogFooter } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { createAccountAction, updateAccountAction } from "../actions";
import { ProxySelectField } from "./ProxySelectField";

/** One form for both create and edit — `account` present means edit, mirroring the
 * proxy slice's `ProxyForm`. Password is required on create and optional on edit
 * (blank keeps the sealed value), so the edit modal submits once, like Add. */
export function AccountForm({
  account,
  proxies,
  onSuccess,
  defaultTimezone = "UTC",
}: {
  account?: LinkedInAccountListItem;
  proxies: ProxyListItem[];
  onSuccess?: () => void;
  defaultTimezone?: string;
}) {
  const isEdit = Boolean(account);
  const action = isEdit ? updateAccountAction : createAccountAction;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Account updated." : "Account added.");
      onSuccess?.();
    }
  }, [state, onSuccess, isEdit]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <Field label="Label">
        <Input name="label" defaultValue={account?.label ?? "primary"} required={!isEdit} />
      </Field>
      {account ? null : (
        <>
          <Field label="LinkedIn email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="LinkedIn password">
            <Input name="password" type="password" required />
          </Field>
        </>
      )}
      <Field label={isEdit ? "Timezone" : "Timezone (IANA id)"}>
        <Input name="timezone" defaultValue={account?.timezone ?? defaultTimezone} required={!isEdit} />
      </Field>
      <ProxySelectField proxies={proxies} defaultValue={account?.proxyId} />
      {isEdit ? (
        <Field label="New LinkedIn password" hint="Leave blank to keep the current password.">
          <Input name="password" type="password" />
        </Field>
      ) : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {isEdit ? (pending ? "Saving…" : "Save details") : pending ? "Adding…" : "Add LinkedIn account"}
        </Button>
      </DialogFooter>
    </form>
  );
}
