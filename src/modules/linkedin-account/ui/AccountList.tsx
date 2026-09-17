import Link from "next/link";
import type { LinkedInAccountListItem } from "../repository/linkedInAccount.repository";
import { Badge } from "@/ui/Badge";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";
import { TestConnectionButton } from "./TestConnectionButton";

const STATUS_TONE = {
  UNVERIFIED: "neutral",
  ACTIVE: "success",
  COOLING_DOWN: "accent",
  CHALLENGED: "danger",
  RESTRICTED: "danger",
  DISABLED: "neutral",
} as const;

export function AccountList({ accounts }: { accounts: LinkedInAccountListItem[] }) {
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
          <tr key={account.id}>
            <Td>
              <Link href={`/config/accounts/${account.id}`} className="text-[--color-accent] hover:underline">
                {account.label}
              </Link>
            </Td>
            <Td>{account.email}</Td>
            <Td>
              <Badge tone={STATUS_TONE[account.status]}>{account.status}</Badge>
              {account.statusReason ? <p className="mt-0.5 text-xs text-[--color-muted]">{account.statusReason}</p> : null}
            </Td>
            <Td>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "never"}</Td>
            <Td>
              <TestConnectionButton accountId={account.id} />
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
