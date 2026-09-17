"use client";

import { useActionState } from "react";
import type { LinkedInAccountDetail } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { updateAccountAction, rotatePasswordAction } from "../actions";

export function AccountEditForm({
  account,
  proxies,
}: {
  account: LinkedInAccountDetail;
  proxies: ProxyListItem[];
}) {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAccountAction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={account.id} />
            <Field label="Label">
              <Input name="label" defaultValue={account.label} />
            </Field>
            <Field label="Timezone">
              <Input name="timezone" defaultValue={account.timezone} />
            </Field>
            <Field label="Proxy">
              <Select name="proxyId" defaultValue={account.proxyId ?? "none"}>
                <option value="none">None (direct connection)</option>
                {proxies.map((proxy) => (
                  <option key={proxy.id} value={proxy.id}>
                    {proxy.label} ({proxy.host}:{proxy.port})
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <RotatePasswordForm accountId={account.id} />
    </div>
  );
}

function RotatePasswordForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState(rotatePasswordAction, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotate password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={accountId} />
          <Field label="New LinkedIn password">
            <Input name="password" type="password" required />
          </Field>
          <Button type="submit" variant="secondary" loading={pending} className="self-start">
            {pending ? "Rotating…" : "Rotate password"}
          </Button>
          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  );
}
