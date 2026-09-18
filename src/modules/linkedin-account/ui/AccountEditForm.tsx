"use client";

import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { AccountForm } from "./AccountForm";

/** Edit modal content: the shared `AccountForm` in edit mode — one submit covers
 * label, timezone, proxy, and an optional password rotation. */
export function AccountEditForm({
  account,
  proxies,
  onSuccess,
}: {
  account: LinkedInAccountListItem;
  proxies: ProxyListItem[];
  onSuccess?: () => void;
}) {
  return <AccountForm account={account} proxies={proxies} onSuccess={onSuccess} />;
}
