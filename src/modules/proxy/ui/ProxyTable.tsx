import type { ProxyListItem } from "../repository/proxy.repository";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";
import { setProxyActiveAction } from "../actions";

const HEALTH_TONE = { UNKNOWN: "neutral", HEALTHY: "success", DEGRADED: "accent", DEAD: "danger" } as const;

export function ProxyTable({ proxies, accountCounts }: { proxies: ProxyListItem[]; accountCounts: Record<string, number> }) {
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
          <tr key={proxy.id}>
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
              {accountCounts[proxy.id] > 1 ? (
                <Badge tone="accent">{accountCounts[proxy.id]} accounts</Badge>
              ) : (
                (accountCounts[proxy.id] ?? 0)
              )}
            </Td>
            <Td>{proxy.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}</Td>
            <Td>
              <form action={setProxyActiveAction}>
                <input type="hidden" name="id" value={proxy.id} />
                <input type="hidden" name="active" value={proxy.active ? "false" : "true"} />
                <Button type="submit" variant={proxy.active ? "danger" : "secondary"} size="sm">
                  {proxy.active ? "Deactivate" : "Reactivate"}
                </Button>
              </form>
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
