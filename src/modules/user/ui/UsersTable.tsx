"use client";

import type { UserListItem } from "../repository/user.repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form/Select";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { updateUserRoleAction, setUserDisabledAction } from "../actions";
import { DeleteUserButton } from "./DeleteUserButton";

const ROLES = ["VIEWER", "OPERATOR", "ADMIN"] as const;

export function UsersTable({
  users,
  canManage,
  currentUserId,
}: {
  users: UserListItem[];
  canManage: boolean;
  currentUserId?: string;
}) {
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  return (
    <Table>
      <Thead>
        <tr>
          <Th>Email</Th>
          <Th>Name</Th>
          <Th>Role</Th>
          <Th>Status</Th>
          {canManage ? <Th>Actions</Th> : null}
        </tr>
      </Thead>
      <Tbody>
        {users.map((user) => (
          <Tr key={user.id}>
            <Td>{user.email}</Td>
            <Td>{user.name ?? "—"}</Td>
            <Td>
              {canManage ? (
                <form action={updateUserRoleAction} className="inline-flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <Select
                    name="role"
                    defaultValue={user.role}
                    onChange={(e) => {
                      e.currentTarget.form?.requestSubmit();
                    }}
                    className="h-7 text-xs"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </form>
              ) : (
                <Badge tone="accent">{user.role}</Badge>
              )}
            </Td>
            <Td>
              {user.disabledAt ? (
                <Badge tone="danger">Disabled</Badge>
              ) : (
                <Badge tone="success">Active</Badge>
              )}
            </Td>
            {canManage ? (
              <Td>
                <div className="flex items-start gap-2">
                  <form action={setUserDisabledAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="disabled" value={user.disabledAt ? "false" : "true"} />
                    <Button
                      type="submit"
                      variant={user.disabledAt ? "secondary" : "danger"}
                      size="sm"
                    >
                      {user.disabledAt ? "Enable" : "Disable"}
                    </Button>
                  </form>
                  <DeleteUserButton
                    id={user.id}
                    email={user.email}
                    disabled={
                      user.id === currentUserId ||
                      (user.role === "ADMIN" && adminCount <= 1)
                    }
                    disabledReason={
                      user.id === currentUserId
                        ? "You cannot delete your own account"
                        : "Cannot delete the last admin user"
                    }
                  />
                </div>
              </Td>
            ) : null}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
