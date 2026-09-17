import Link from "next/link";
import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";
import { JobsTable } from "@/modules/jobs/ui/JobsTable";
import { cn } from "@/ui/cn";
import type { JobStatus } from "@/generated/prisma/enums";

const STATUSES: Array<JobStatus | undefined> = [undefined, "QUEUED", "RUNNING", "FAILED", "DEAD", "SUCCEEDED", "CANCELLED"];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const jobs = await jobsRepo.listByStatus(status as JobStatus | undefined);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-[--color-fg]">Jobs</h1>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/jobs?status=${s}` : "/jobs"}
            className={cn(
              "rounded-full border border-[--color-border] px-3 py-1 text-xs",
              (status ?? undefined) === s ? "bg-[--color-accent] text-white" : "text-[--color-muted]",
            )}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>
      <JobsTable jobs={jobs} />
      {jobs.length === 0 ? <p className="text-sm text-[--color-muted]">No jobs.</p> : null}
    </div>
  );
}
