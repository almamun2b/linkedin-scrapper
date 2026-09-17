import { logger } from "@/server/logger";
import { noopPayloadSchema } from "@/modules/jobs/domain/payloads";
import { FatalError, RetryableError } from "@/modules/jobs/domain/errors";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "noop" });

/**
 * Proves the queue (claim → run → complete, and the reaper on a killed worker) without any
 * Playwright/LinkedIn code. `sleepMs` is a test aid for exercising lease expiry manually —
 * not a scraper pacing delay, so CLAUDE.md invariant #8 doesn't apply to it.
 */
export async function handleNoop(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = noopPayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid noop payload", { issues: parsed.error.issues });
  }
  const { echo, sleepMs } = parsed.data;
  log.info({ jobId: job.id, echo }, "noop running");
  if (sleepMs) {
    await sleepCancellable(sleepMs, signal);
  }
  log.info({ jobId: job.id }, "noop done");
}

function sleepCancellable(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new RetryableError("Cancelled before sleep started"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new RetryableError("Cancelled during sleep — shutdown or cancelRequestedAt"));
    });
  });
}
