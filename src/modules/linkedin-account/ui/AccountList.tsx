import Link from "next/link";
import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { TestConnectionButton } from "./TestConnectionButton";
import { DeleteAccountButton } from "./DeleteAccountButton";

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
  canDelete,
}: {
  accounts: LinkedInAccountListItem[];
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
          <Th>Actions</Th>
        </tr>
      </Thead>
      <Tbody>
        {accounts.map((account) => (
          <Tr key={account.id}>
            <Td>
              <Link
                href={`/config/accounts/${account.id}`}
                className="font-medium text-primary hover:underline"
              >
                {account.label}
              </Link>
            </Td>
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
            <Td>
              <div className="flex items-start gap-2">
                <TestConnectionButton accountId={account.id} />
                {canDelete ? <DeleteAccountButton id={account.id} label={account.label} /> : null}
              </div>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
