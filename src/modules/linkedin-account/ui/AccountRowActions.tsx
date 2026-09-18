"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Dialog } from "@/components/ui/Dialog";
import { IconAction, RowActions } from "@/components/ui/RowActions";
import { TestConnectionButton } from "./TestConnectionButton";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { AccountEditForm } from "./AccountEditForm";

export function AccountRowActions({
  account,
  proxies,
  canDelete,
}: {
  account: LinkedInAccountListItem;
  proxies: ProxyListItem[];
  canDelete: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <RowActions>
      <TestConnectionButton accountId={account.id} />
      <IconAction
        icon={<Pencil aria-hidden="true" className="size-4" />}
        label="Edit account"
        onClick={() => { setEditOpen(true); }}
      />
      <Dialog
        open={editOpen}
        onClose={() => { setEditOpen(false); }}
        title={account.label}
        description={account.email}
      >
        <AccountEditForm account={account} proxies={proxies} onSuccess={() => { setEditOpen(false); }} />
      </Dialog>
      {canDelete ? (
        <DeleteAccountButton
          id={account.id}
          label={account.label}
          searches={account._count.searchDefinitions}
          runs={account._count.scrapeRuns}
        />
      ) : null}
    </RowActions>
  );
}
