"use client";

import { useActionState } from "react";
import type { LinkedInAccountDetail } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Button } from "@/ui/Button";
import { updateAccountAction, rotatePasswordAction } from "../actions";

export function AccountEditForm({ account, proxies }: { account: LinkedInAccountDetail; proxies: ProxyListItem[] }) {
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <form action={updateAccountAction} className="flex flex-col gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
        <input type="hidden" name="id" value={account.id} />
        <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
          Label
          <input name="label" defaultValue={account.label} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
          Timezone
          <input name="timezone" defaultValue={account.timezone} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
          Proxy
          <select name="proxyId" defaultValue={account.proxyId ?? "none"} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm">
            <option value="none">None (direct connection)</option>
            {proxies.map((proxy) => (
              <option key={proxy.id} value={proxy.id}>
                {proxy.label} ({proxy.host}:{proxy.port})
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Save</Button>
      </form>
      <RotatePasswordForm accountId={account.id} />
    </div>
  );
}

function RotatePasswordForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState(rotatePasswordAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
      <input type="hidden" name="id" value={accountId} />
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        New LinkedIn password
        <input name="password" type="password" required className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Rotating…" : "Rotate password"}
      </Button>
      {state?.error ? <p className="text-sm text-[--color-danger]">{state.error}</p> : null}
    </form>
  );
}
