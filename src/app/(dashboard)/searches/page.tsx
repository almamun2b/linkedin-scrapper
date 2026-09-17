import Link from "next/link";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import { Badge } from "@/ui/Badge";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";

export default async function SearchesPage() {
  const searches = await searchRepo.list();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[--color-fg]">Searches</h1>
        <Link href="/searches/new" className="text-sm text-[--color-accent] hover:underline">
          + New search
        </Link>
      </div>
      <Table>
        <Thead>
          <tr>
            <Th>Name</Th>
            <Th>Keywords</Th>
            <Th>Max pages</Th>
            <Th>Status</Th>
          </tr>
        </Thead>
        <Tbody>
          {searches.map((s) => (
            <tr key={s.id}>
              <Td>
                <Link href={`/searches/${s.id}`} className="text-[--color-accent] hover:underline">
                  {s.name}
                </Link>
              </Td>
              <Td>{s.keywords ?? "—"}</Td>
              <Td>{s.maxPages}</Td>
              <Td>{s.enabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="neutral">Disabled</Badge>}</Td>
            </tr>
          ))}
        </Tbody>
      </Table>
      {searches.length === 0 ? <p className="text-sm text-[--color-muted]">No searches yet.</p> : null}
    </div>
  );
}
