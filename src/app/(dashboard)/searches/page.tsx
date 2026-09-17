import Link from "next/link";
import { Plus, Search } from "lucide-react";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";

export default async function SearchesPage() {
  const searches = await searchRepo.list();

  return (
    <div>
      <PageHeader
        title="Searches"
        description="Structured filters that the queue runs against LinkedIn people search."
        actions={
          <ButtonLink href="/searches/new" size="sm">
            <Plus aria-hidden="true" className="size-4" />
            New search
          </ButtonLink>
        }
      />
      {searches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No searches yet"
          description="Create a search to define the filters a run will use."
          action={
            <ButtonLink href="/searches/new" size="sm">
              New search
            </ButtonLink>
          }
        />
      ) : (
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
              <Tr key={s.id}>
                <Td>
                  <Link
                    href={`/searches/${s.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.name}
                  </Link>
                </Td>
                <Td>{s.keywords ?? "—"}</Td>
                <Td>{s.maxPages}</Td>
                <Td>
                  {s.enabled ? (
                    <Badge tone="success">Enabled</Badge>
                  ) : (
                    <Badge tone="neutral">Disabled</Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
