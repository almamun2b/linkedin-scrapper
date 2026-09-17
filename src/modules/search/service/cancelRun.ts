import { logger } from "@/server/logger";
import * as runRepo from "../repository/scrapeRun.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { cancelRunJobs } from "@/modules/jobs/service/queue.service";
import { RunStatus } from "@/generated/prisma/enums";

const log = logger.child({ module: "search.cancelRun" });

/**
 * `cancelRequestedAt` is what an in-flight handler's AbortSignal checks (ARCHITECTURE §6.7);
 * a QUEUED run has no handler running yet to notice it, so this also finalizes the run to
 * CANCELLED directly — otherwise a run whose only job never got claimed would sit QUEUED
 * forever, which reads to an operator as "still going to happen."
 */
export async function cancelRun(runId: string, actorId: string | null): Promise<void> {
  const run = await runRepo.findById(runId);
  await runRepo.requestCancel(runId);
  await cancelRunJobs(runId);
  if (run && (run.status === RunStatus.QUEUED || run.status === RunStatus.PAUSED)) {
    await runRepo.finalize(runId, RunStatus.CANCELLED);
  }
  await auditRepo.record({
    actorId,
    action: "scrape_run.cancel_requested",
    entity: "ScrapeRun",
    entityId: runId,
  });
  log.info({ scrapeRunId: runId }, "run cancel requested");
}
