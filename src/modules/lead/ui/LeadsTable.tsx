import type { LeadModel } from "@/generated/prisma/models/Lead";
import { Badge } from "@/ui/Badge";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";

const STAGE_TONE = { STUB: "neutral", SCRAPED: "accent", ENRICHED: "success", FAILED: "danger" } as const;

export function LeadsTable({ leads }: { leads: LeadModel[] }) {
  return (
    <Table>
      <Thead>
        <tr>
          <Th>Name</Th>
          <Th>Title</Th>
          <Th>Company</Th>
          <Th>Email</Th>
          <Th>Website</Th>
          <Th>Stage</Th>
        </tr>
      </Thead>
      <Tbody>
        {leads.map((lead) => (
          <tr key={lead.id}>
            <Td>
              <a href={lead.profileUrl} target="_blank" rel="noreferrer" className="text-[--color-accent] hover:underline">
                {lead.fullName ?? lead.publicIdentifier}
              </a>
            </Td>
            <Td>{lead.currentTitle ?? "—"}</Td>
            <Td>{lead.currentCompany ?? "—"}</Td>
            <Td>{lead.email ?? "—"}</Td>
            <Td>{lead.websiteUrl ?? "—"}</Td>
            <Td>
              <Badge tone={STAGE_TONE[lead.stage]}>{lead.stage}</Badge>
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
