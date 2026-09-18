"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { AccountForm } from "./AccountForm";

export function AddAccountButton({
  defaultTimezone,
  proxies,
}: {
  defaultTimezone: string;
  proxies: ProxyListItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => { setOpen(true); }}>
        <Plus aria-hidden="true" className="size-4" />
        Add account
      </Button>
      <Dialog
        open={open}
        onClose={() => { setOpen(false); }}
        title="Add LinkedIn account"
        description="The worker logs in and scrapes as this account. Credentials are sealed at rest."
      >
        <AccountForm
          onSuccess={() => { setOpen(false); }}
          defaultTimezone={defaultTimezone}
          proxies={proxies}
        />
      </Dialog>
    </>
  );
}
