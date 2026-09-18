import type { UserListItem } from "../repository/user.repository";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { UserRowActions } from "./UserRowActions";

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
          {canManage ? <Th className="text-right">Actions</Th> : null}
        </tr>
      </Thead>
      <Tbody>
        {users.map((user) => (
          <Tr key={user.id}>
            <Td>{user.email}</Td>
            <Td>{user.name ?? "—"}</Td>
            <Td>
              <Badge tone="accent">{user.role}</Badge>
            </Td>
            <Td>
              {user.disabledAt ? (
                <Badge tone="danger">Disabled</Badge>
              ) : (
                <Badge tone="success">Active</Badge>
              )}
            </Td>
            {canManage ? (
              <Td className="text-right">
                <UserRowActions
                  user={user}
                  disableDelete={
                    user.id === currentUserId || (user.role === "ADMIN" && adminCount <= 1)
                  }
                  disableDeleteReason={
                    user.id === currentUserId
                      ? "You cannot delete your own account"
                      : "Cannot delete the last admin user"
                  }
                />
              </Td>
            ) : null}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
