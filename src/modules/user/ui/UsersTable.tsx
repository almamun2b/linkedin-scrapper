"use client";

import type { UserListItem } from "../repository/user.repository";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";
import { updateUserRoleAction, setUserDisabledAction } from "../actions";

const ROLES = ["VIEWER", "OPERATOR", "ADMIN"] as const;

export function UsersTable({ users, canManage }: { users: UserListItem[]; canManage: boolean }) {
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
          <tr key={user.id}>
            <Td>{user.email}</Td>
            <Td>{user.name ?? "—"}</Td>
            <Td>
              {canManage ? (
                <form action={updateUserRoleAction} className="inline-flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="rounded-md border border-[--color-border] bg-transparent px-2 py-1 text-xs"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </form>
              ) : (
                <Badge tone="accent">{user.role}</Badge>
              )}
            </Td>
            <Td>
              {user.disabledAt ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Active</Badge>}
            </Td>
            {canManage ? (
              <Td>
                <form action={setUserDisabledAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="disabled" value={user.disabledAt ? "false" : "true"} />
                  <Button type="submit" variant={user.disabledAt ? "secondary" : "danger"} size="sm">
                    {user.disabledAt ? "Enable" : "Disable"}
                  </Button>
                </form>
              </Td>
            ) : null}
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
