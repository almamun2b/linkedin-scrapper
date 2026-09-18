import type { ProxyListItem } from "../repository/proxy.repository";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { ProxyRowActions } from "./ProxyRowActions";

const HEALTH_TONE = {
  UNKNOWN: "neutral",
  HEALTHY: "success",
  DEGRADED: "accent",
  DEAD: "danger",
} as const;

export function ProxyTable({
  proxies,
  accountCounts,
}: {
  proxies: ProxyListItem[];
  accountCounts: Record<string, number>;
}) {
  return (
    <Table>
      <Thead>
        <tr>
          <Th>Label</Th>
          <Th>Host</Th>
          <Th>Protocol</Th>
          <Th>Country</Th>
          <Th>Health</Th>
          <Th>Shared by</Th>
          <Th>Status</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </Thead>
      <Tbody>
        {proxies.map((proxy) => (
          <Tr key={proxy.id}>
            <Td>{proxy.label}</Td>
            <Td>
              {proxy.host}:{proxy.port}
            </Td>
            <Td>{proxy.protocol}</Td>
            <Td>{proxy.country ?? "—"}</Td>
            <Td>
              <Badge tone={HEALTH_TONE[proxy.health]}>{proxy.health}</Badge>
            </Td>
            <Td>
              {(() => {
                const count = accountCounts[proxy.id] ?? 0;
                return count > 1 ? <Badge tone="accent">{count} accounts</Badge> : count;
              })()}
            </Td>
            <Td>
              {proxy.active ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Badge tone="danger">Inactive</Badge>
              )}
            </Td>
            <Td className="text-right">
              <ProxyRowActions proxy={proxy} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
