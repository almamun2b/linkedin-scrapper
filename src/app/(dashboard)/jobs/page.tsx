import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";
import { JobsTable } from "@/modules/jobs/ui/JobsTable";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import type { JobStatus } from "@/generated/prisma/enums";

const STATUSES: (JobStatus | undefined)[] = [
  undefined,
  "QUEUED",
  "RUNNING",
  "FAILED",
  "DEAD",
  "SUCCEEDED",
  "CANCELLED",
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const jobs = await jobsRepo.listByStatus(status as JobStatus | undefined);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Jobs" description="The Postgres-backed queue — every step a run takes." />
      <FilterChips
        items={STATUSES.map((s) => ({
          key: s ?? "all",
          label: s ?? "All",
          href: s ? `/jobs?status=${s}` : "/jobs",
          active: (status ?? undefined) === s,
        }))}
      />
      <JobsTable jobs={jobs} />
    </div>
  );
}
