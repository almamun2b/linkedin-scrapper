import { logger } from "@/server/logger";
import { FatalError } from "@/modules/jobs/domain/errors";
import { runFinalizePayloadSchema } from "@/modules/jobs/domain/payloads";
import * as runRepo from "@/modules/search/repository/scrapeRun.repository";
import * as auditRepo from "@/modules/audit/repository/auditEvent.repository";
import { RunStatus } from "@/generated/prisma/enums";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "run.finalize" });

const TERMINAL: RunStatus[] = [
  RunStatus.SUCCEEDED,
  RunStatus.FAILED,
  RunStatus.HALTED,
  RunStatus.CANCELLED,
];

/** No browser, no lock. No-ops if already terminal — avoids racing a HALTED run set by a
 * risk signal in the same run's last search.page.fetch. */
export async function handleRunFinalize(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  void signal;
  const parsed = runFinalizePayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid run.finalize payload", { issues: parsed.error.issues });
  }
  const { scrapeRunId } = parsed.data;

  const run = await runRepo.findById(scrapeRunId);
  if (!run) {
    throw new FatalError(`ScrapeRun ${scrapeRunId} not found`);
  }
  if (TERMINAL.includes(run.status)) {
    log.info({ scrapeRunId, status: run.status }, "run already terminal, no-op");
    return;
  }

  await runRepo.finalize(scrapeRunId, RunStatus.SUCCEEDED);
  await auditRepo.record({
    action: "scrape_run.finalized",
    entity: "ScrapeRun",
    entityId: scrapeRunId,
    data: {
      pagesDone: run.pagesDone,
      profilesDone: run.profilesDone,
      leadsNew: run.leadsNew,
      emailsFound: run.emailsFound,
    },
  });
  log.info({ scrapeRunId }, "run finalized");
}
