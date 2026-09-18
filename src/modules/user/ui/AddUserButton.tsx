"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CreateUserForm } from "./CreateUserForm";

export function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => { setOpen(true); }}>
        <Plus aria-hidden="true" className="size-4" />
        Create user
      </Button>
      <Dialog open={open} onClose={() => { setOpen(false); }} title="Create user">
        <CreateUserForm onSuccess={() => { setOpen(false); }} />
      </Dialog>
    </>
  );
}
