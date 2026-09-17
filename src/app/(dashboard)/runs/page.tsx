import * as runRepo from "@/modules/search/repository/scrapeRun.repository";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import { RunStatus } from "@/generated/prisma/enums";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";
import { cancelRunAction } from "@/modules/search/actions";

const STATUS_TONE = {
  QUEUED: "neutral",
  RUNNING: "accent",
  PAUSED: "accent",
  SUCCEEDED: "success",
  FAILED: "danger",
  HALTED: "danger",
  CANCELLED: "neutral",
} as const;

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const runs = await runRepo.list({ status: status ? (status as RunStatus) : undefined });
  const names = Object.fromEntries(
    await Promise.all(
      [...new Set(runs.map((r) => r.searchDefinitionId))].map(async (id) => [id, (await searchRepo.findById(id))?.name ?? id] as const),
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-[--color-fg]">Runs</h1>
      <Table>
        <Thead>
          <tr>
            <Th>Search</Th>
            <Th>Status</Th>
            <Th>Pages / Profiles</Th>
            <Th>Leads new</Th>
            <Th>Emails found</Th>
            <Th>Started</Th>
            <Th>Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <Td>{names[run.searchDefinitionId]}</Td>
              <Td>
                <Badge tone={STATUS_TONE[run.status]}>{run.status}</Badge>
                {run.haltReason ? <p className="mt-0.5 text-xs text-[--color-muted]">{run.haltReason}</p> : null}
              </Td>
              <Td>
                {run.pagesDone} / {run.profilesDone}
              </Td>
              <Td>{run.leadsNew}</Td>
              <Td>{run.emailsFound}</Td>
              <Td>{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</Td>
              <Td>
                {run.status === "QUEUED" || run.status === "RUNNING" ? (
                  <form action={cancelRunAction}>
                    <input type="hidden" name="runId" value={run.id} />
                    <Button type="submit" variant="danger" size="sm">
                      Cancel
                    </Button>
                  </form>
                ) : null}
              </Td>
            </tr>
          ))}
        </Tbody>
      </Table>
      {runs.length === 0 ? <p className="text-sm text-[--color-muted]">No runs yet — start one from a search.</p> : null}
    </div>
  );
}
