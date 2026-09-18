import * as runRepo from "@/modules/search/repository/scrapeRun.repository";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import { RunStatus } from "@/generated/prisma/enums";
import { ListChecks, Ban } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { IconAction } from "@/components/ui/RowActions";
import { cancelRunAction } from "@/modules/search/actions";

const STATUS_TONE: Record<RunStatus, BadgeTone> = {
  QUEUED: "neutral",
  RUNNING: "accent",
  PAUSED: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  HALTED: "danger",
  CANCELLED: "neutral",
};

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const runs = await runRepo.list({ status: status ? (status as RunStatus) : undefined });
  const names = Object.fromEntries(
    await Promise.all(
      [...new Set(runs.map((r) => r.searchDefinitionId))].map(
        async (id) => [id, (await searchRepo.findById(id))?.name ?? id] as const,
      ),
    ),
  );

  return (
    <div>
      <PageHeader
        title="Runs"
        description="Paced execution of a search — minutes to hours per run by design."
      />
      {runs.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No runs yet"
          description="Start one from a search's detail page."
          action={<ButtonLink href="/searches">Go to searches</ButtonLink>}
        />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Search</Th>
              <Th>Status</Th>
              <Th>Pages / Profiles</Th>
              <Th>Leads new</Th>
              <Th>Emails found</Th>
              <Th>Started</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {runs.map((run) => (
              <Tr key={run.id}>
                <Td>{names[run.searchDefinitionId]}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[run.status]}>{run.status}</Badge>
                  {run.haltReason ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{run.haltReason}</p>
                  ) : null}
                </Td>
                <Td>
                  {run.pagesDone} / {run.profilesDone}
                </Td>
                <Td>{run.leadsNew}</Td>
                <Td>{run.emailsFound}</Td>
                <Td>{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</Td>
                <Td className="text-right">
                  {run.status === "QUEUED" || run.status === "RUNNING" ? (
                    <form action={cancelRunAction} className="inline-flex justify-end">
                      <input type="hidden" name="runId" value={run.id} />
                      <IconAction
                        type="submit"
                        icon={<Ban aria-hidden="true" className="size-4" />}
                        label="Cancel run"
                        tone="danger"
                      />
                    </form>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
