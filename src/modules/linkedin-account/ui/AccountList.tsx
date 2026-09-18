import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { AccountRowActions } from "./AccountRowActions";

const STATUS_TONE: Record<LinkedInAccountListItem["status"], BadgeTone> = {
  UNVERIFIED: "neutral",
  ACTIVE: "success",
  COOLING_DOWN: "warning",
  CHALLENGED: "danger",
  RESTRICTED: "danger",
  DISABLED: "neutral",
};

export function AccountList({
  accounts,
  proxies,
  canDelete,
}: {
  accounts: LinkedInAccountListItem[];
  proxies: ProxyListItem[];
  canDelete: boolean;
}) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No LinkedIn accounts yet"
        description="Add the account the worker will log in and scrape as."
      />
    );
  }

  return (
    <Table>
      <Thead>
        <tr>
          <Th>Label</Th>
          <Th>Email</Th>
          <Th>Status</Th>
          <Th>Last login</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </Thead>
      <Tbody>
        {accounts.map((account) => (
          <Tr key={account.id}>
            <Td className="font-medium text-foreground">{account.label}</Td>
            <Td>{account.email}</Td>
            <Td>
              <Badge tone={STATUS_TONE[account.status]}>{account.status}</Badge>
              {account.statusReason ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{account.statusReason}</p>
              ) : null}
            </Td>
            <Td>
              {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "never"}
            </Td>
            <Td className="text-right">
              <AccountRowActions account={account} proxies={proxies} canDelete={canDelete} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
