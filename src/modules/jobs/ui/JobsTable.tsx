import type { JobModel } from "@/generated/prisma/models/Job";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { JobRowActions } from "./JobRowActions";

const STATUS_TONE: Record<JobModel["status"], BadgeTone> = {
  QUEUED: "neutral",
  RUNNING: "accent",
  SUCCEEDED: "success",
  FAILED: "danger",
  DEAD: "danger",
  CANCELLED: "neutral",
};

export function JobsTable({ jobs }: { jobs: JobModel[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs"
        description="Jobs appear here once a run or a manual action enqueues one."
      />
    );
  }

  return (
    <Table>
      <Thead>
        <tr>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Attempts</Th>
          <Th>Last error</Th>
          <Th>Created</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </Thead>
      <Tbody>
        {jobs.map((job) => (
          <Tr key={job.id}>
            <Td className="font-mono text-xs">{job.type}</Td>
            <Td>
              <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
            </Td>
            <Td>
              {job.attempts} / {job.maxAttempts}
            </Td>
            <Td
              className="max-w-xs truncate text-xs text-muted-foreground"
              title={job.lastError ?? undefined}
            >
              {job.lastError ?? "—"}
            </Td>
            <Td>{new Date(job.createdAt).toLocaleString()}</Td>
            <Td className="text-right">
              <JobRowActions job={job} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
