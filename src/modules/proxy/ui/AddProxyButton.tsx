"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ProxyForm } from "./ProxyForm";

export function AddProxyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => { setOpen(true); }} className="self-start">
        <Plus aria-hidden="true" className="size-4" />
        Add proxy
      </Button>
      <Dialog open={open} onClose={() => { setOpen(false); }} title="Add proxy">
        <ProxyForm onSuccess={() => { setOpen(false); }} />
      </Dialog>
    </>
  );
}
