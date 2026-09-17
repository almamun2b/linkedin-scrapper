import { ExternalLink } from "lucide-react";
import type { LeadModel } from "@/generated/prisma/models/Lead";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";

const STAGE_TONE: Record<LeadModel["stage"], BadgeTone> = {
  STUB: "neutral",
  SCRAPED: "accent",
  ENRICHED: "success",
  FAILED: "danger",
};

export function LeadsTable({ leads }: { leads: LeadModel[] }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="Leads land here once a run collects and parses profiles."
      />
    );
  }

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
          <Tr key={lead.id}>
            <Td>
              <a
                href={lead.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {lead.fullName ?? lead.publicIdentifier}
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </Td>
            <Td>{lead.currentTitle ?? "—"}</Td>
            <Td>{lead.currentCompany ?? "—"}</Td>
            <Td className="max-w-48 truncate" title={lead.email ?? undefined}>
              {lead.email ?? "—"}
            </Td>
            <Td className="max-w-48 truncate" title={lead.websiteUrl ?? undefined}>
              {lead.websiteUrl ?? "—"}
            </Td>
            <Td>
              <Badge tone={STAGE_TONE[lead.stage]}>{lead.stage}</Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
