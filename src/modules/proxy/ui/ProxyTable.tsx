import type { ProxyListItem } from "../repository/proxy.repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { setProxyActiveAction } from "../actions";

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
          <Th>Actions</Th>
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
            <Td>
              <form action={setProxyActiveAction}>
                <input type="hidden" name="id" value={proxy.id} />
                <input type="hidden" name="active" value={proxy.active ? "false" : "true"} />
                <Button type="submit" variant={proxy.active ? "danger" : "secondary"} size="sm">
                  {proxy.active ? "Deactivate" : "Reactivate"}
                </Button>
              </form>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
