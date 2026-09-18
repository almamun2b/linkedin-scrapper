"use client";

import { useState } from "react";
import { Pencil, KeyRound, UserCheck, UserX } from "lucide-react";
import type { UserListItem } from "../repository/user.repository";
import { Dialog } from "@/components/ui/Dialog";
import { IconAction, RowActions } from "@/components/ui/RowActions";
import { setUserDisabledAction } from "../actions";
import { EditUserForm } from "./EditUserForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeleteUserButton } from "./DeleteUserButton";

export function UserRowActions({
  user,
  disableDelete,
  disableDeleteReason,
}: {
  user: UserListItem;
  disableDelete: boolean;
  disableDeleteReason?: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <RowActions>
      <IconAction
        icon={<Pencil aria-hidden="true" className="size-4" />}
        label="Edit user"
        onClick={() => { setEditOpen(true); }}
      />
      <Dialog open={editOpen} onClose={() => { setEditOpen(false); }} title={`Edit ${user.email}`}>
        <EditUserForm user={user} onSuccess={() => { setEditOpen(false); }} />
      </Dialog>

      <IconAction
        icon={<KeyRound aria-hidden="true" className="size-4" />}
        label="Reset password"
        onClick={() => { setResetOpen(true); }}
      />
      <Dialog open={resetOpen} onClose={() => { setResetOpen(false); }} title={`Reset password for ${user.email}`}>
        <ChangePasswordForm userId={user.id} self={false} />
      </Dialog>

      <form action={setUserDisabledAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="disabled" value={user.disabledAt ? "false" : "true"} />
        <IconAction
          type="submit"
          icon={
            user.disabledAt ? (
              <UserCheck aria-hidden="true" className="size-4" />
            ) : (
              <UserX aria-hidden="true" className="size-4" />
            )
          }
          label={user.disabledAt ? "Enable user" : "Disable user"}
          tone={user.disabledAt ? "default" : "danger"}
        />
      </form>

      <DeleteUserButton
        id={user.id}
        email={user.email}
        disabled={disableDelete}
        disabledReason={disableDeleteReason}
      />
    </RowActions>
  );
}
