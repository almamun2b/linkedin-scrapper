import type { JobModel } from "@/generated/prisma/models/Job";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Table, Thead, Tbody, Th, Td } from "@/ui/Table";
import { retryDeadJobAction } from "../actions";

const STATUS_TONE = {
  QUEUED: "neutral",
  RUNNING: "accent",
  SUCCEEDED: "success",
  FAILED: "danger",
  DEAD: "danger",
  CANCELLED: "neutral",
} as const;

export function JobsTable({ jobs }: { jobs: JobModel[] }) {
  return (
    <Table>
      <Thead>
        <tr>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Attempts</Th>
          <Th>Last error</Th>
          <Th>Created</Th>
          <Th>Actions</Th>
        </tr>
      </Thead>
      <Tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <Td>{job.type}</Td>
            <Td>
              <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
            </Td>
            <Td>
              {job.attempts} / {job.maxAttempts}
            </Td>
            <Td className="max-w-xs truncate text-xs text-[--color-muted]">{job.lastError ?? "—"}</Td>
            <Td>{new Date(job.createdAt).toLocaleString()}</Td>
            <Td>
              {job.status === "DEAD" ? (
                <form action={retryDeadJobAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Retry
                  </Button>
                </form>
              ) : null}
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
