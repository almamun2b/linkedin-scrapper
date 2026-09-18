"use client";

import { useState, useTransition } from "react";
import { Pencil, Power, PowerOff } from "lucide-react";
import type { ProxyListItem } from "../repository/proxy.repository";
import { toast } from "@/components/ui/Toaster";
import { Dialog } from "@/components/ui/Dialog";
import { IconAction, RowActions } from "@/components/ui/RowActions";
import { setProxyActiveAction } from "../actions";
import { ProxyForm } from "./ProxyForm";

export function ProxyRowActions({ proxy }: { proxy: ProxyListItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", proxy.id);
      formData.set("active", proxy.active ? "false" : "true");
      try {
        await setProxyActiveAction(formData);
        toast.success(proxy.active ? "Proxy deactivated." : "Proxy reactivated.");
      } catch {
        toast.error("Something went wrong — check the server logs.");
      }
    });
  }

  return (
    <RowActions>
      <IconAction
        icon={<Pencil aria-hidden="true" className="size-4" />}
        label="Edit proxy"
        onClick={() => { setEditOpen(true); }}
      />
      <Dialog open={editOpen} onClose={() => { setEditOpen(false); }} title={proxy.label}>
        <ProxyForm proxy={proxy} onSuccess={() => { setEditOpen(false); }} />
      </Dialog>
      <IconAction
        icon={
          proxy.active ? (
            <PowerOff aria-hidden="true" className="size-4" />
          ) : (
            <Power aria-hidden="true" className="size-4" />
          )
        }
        label={proxy.active ? "Deactivate proxy" : "Reactivate proxy"}
        tone={proxy.active ? "danger" : "default"}
        disabled={pending}
        onClick={toggleActive}
      />
    </RowActions>
  );
}
