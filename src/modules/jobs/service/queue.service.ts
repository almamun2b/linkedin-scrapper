import { logger } from "@/server/logger";
import * as repo from "../repository/jobs.repository";
import type { ClaimedJob, EnqueueInput } from "../repository/jobs.repository";
import { RetryableError, FatalError, RiskSignalError, RescheduleError } from "../domain/errors";

const log = logger.child({ module: "jobs.service" });

export async function enqueueJob(input: EnqueueInput) {
  try {
    const job = await repo.enqueue(input);
    log.info({ jobId: job.id, type: job.type, queue: job.queue }, "job enqueued");
    return job;
  } catch (error) {
    // idempotencyKey is unique — a repeat enqueue with the same key is not a failure.
    if (isUniqueConstraintError(error)) {
      log.info(
        { type: input.type, idempotencyKey: input.idempotencyKey },
        "job already queued (idempotent)",
      );
      return null;
    }
    throw error;
  }
}

export async function claimBatch(params: {
  queue: string;
  workerId: string;
  leaseSeconds: number;
  limit: number;
}): Promise<ClaimedJob[]> {
  return repo.claim(params);
}

/** Dispatches a handler's outcome to the right queue transition based on the classified error. */
export async function finishJob(
  job: ClaimedJob,
  outcome: { ok: true } | { ok: false; error: Error },
) {
  if (outcome.ok) {
    await repo.complete(job.id);
    log.info({ jobId: job.id, type: job.type }, "job succeeded");
    return;
  }
  const { error } = outcome;
  if (error instanceof RescheduleError) {
    await repo.rescheduleTo(job.id, error.runAt);
    log.info(
      { jobId: job.id, type: job.type, runAt: error.runAt, reason: error.message },
      "job rescheduled",
    );
    return;
  }
  if (error instanceof RiskSignalError) {
    await repo.failRiskSignal(job, error);
    log.warn(
      { jobId: job.id, type: job.type, err: error.message },
      "job hit a risk signal — breaker tripped",
    );
    return;
  }
  if (error instanceof FatalError) {
    await repo.failFatal(job, error);
    log.error({ jobId: job.id, type: job.type, err: error.message }, "job failed fatally");
    return;
  }
  const isRetryable = error instanceof RetryableError;
  if (!isRetryable) {
    log.warn(
      { jobId: job.id, type: job.type, err: error.message },
      "unclassified error treated as retryable",
    );
  }
  const delayMs = backoffDelayMs(job.attempts);
  await repo.failRetryable(job, error, new Date(Date.now() + delayMs));
  log.warn(
    { jobId: job.id, type: job.type, err: error.message, delayMs },
    "job requeued with backoff",
  );
}

export async function cancelAccountJobs(linkedInAccountId: string) {
  return repo.cancelQueuedForAccount(linkedInAccountId);
}

export async function cancelRunJobs(runId: string) {
  return repo.cancelQueuedForRun(runId);
}

export async function retryDeadJob(jobId: string) {
  const result = await repo.retryDeadJob(jobId);
  return result.count > 0;
}

export async function reapExpiredLeases(limit = 100): Promise<number> {
  const expired = await repo.findExpiredRunning(limit);
  for (const job of expired) {
    await repo.resetExpiredLease(job);
    log.warn({ jobId: job.id, type: job.type }, "reaped expired lease");
  }
  return expired.length;
}

export async function logToJob(params: {
  jobId: string;
  level?: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  data?: unknown;
}) {
  return repo.writeLog(params);
}

/** Exponential backoff with full jitter: delay = random(0, min(cap, base * 2^attempt)). */
function backoffDelayMs(attempts: number): number {
  const base = 1000;
  const cap = 5 * 60_000;
  const upper = Math.min(cap, base * 2 ** attempts);
  return Math.floor(Math.random() * upper);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002"
  );
}
