import { gzipSync } from "node:zlib";
import { prisma } from "@/server/db/prisma";
import { claimJobs, type ClaimedJob } from "@/server/db/raw/claimJobs.sql.ts";
import { JobStatus, JobArtifactKind } from "../../../generated/prisma/enums";

export type { ClaimedJob };

export interface EnqueueInput {
  queue?: string;
  type: string;
  payload: unknown;
  priority?: number;
  runAt?: Date;
  idempotencyKey?: string;
  runId?: string;
  linkedInAccountId?: string;
}

/** The only file in modules/jobs importing `prisma` (CLAUDE.md invariant #6). */
export async function enqueue(input: EnqueueInput) {
  return prisma.job.create({
    data: {
      queue: input.queue ?? "default",
      type: input.type,
      payload: input.payload as never,
      priority: input.priority,
      runAt: input.runAt,
      idempotencyKey: input.idempotencyKey,
      runId: input.runId,
      linkedInAccountId: input.linkedInAccountId,
    },
  });
}

export async function claim(params: {
  queue: string;
  workerId: string;
  leaseSeconds: number;
  limit: number;
}): Promise<ClaimedJob[]> {
  return claimJobs(params);
}

export async function complete(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.SUCCEEDED,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      finishedAt: new Date(),
    },
  });
}

export async function failRetryable(job: ClaimedJob, error: Error, nextRunAt: Date) {
  const dead = job.attempts >= job.maxAttempts;
  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: dead ? JobStatus.DEAD : JobStatus.QUEUED,
      runAt: dead ? job.runAt : nextRunAt,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      lastError: error.message,
      finishedAt: dead ? new Date() : null,
    },
  });
}

export async function failFatal(job: ClaimedJob, error: Error) {
  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: JobStatus.DEAD,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      lastError: error.message,
      finishedAt: new Date(),
    },
  });
}

export async function failRiskSignal(job: ClaimedJob, error: Error) {
  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: JobStatus.DEAD,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      lastError: error.message,
      finishedAt: new Date(),
    },
  });
}

/**
 * Not a failure — a lock push-back, outside active hours, or quota exhausted. Meant to
 * leave `attempts` untouched the way a retry would (CLAUDE.md invariant #2, ARCHITECTURE
 * §9: "rescheduled ... not retried"), but by the time a handler can call this,
 * `claimJobs.sql.ts` has already done `attempts = attempts + 1` for the claim — so this
 * decrements it back rather than leaving it, or every reschedule would silently burn a
 * real attempt (this is what parked the very first `session.ensure` job at `attempts: 1`
 * before it ever ran).
 */
export async function rescheduleTo(jobId: string, runAt: Date) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.QUEUED,
      runAt,
      attempts: { decrement: 1 },
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
    },
  });
}

/** Human-initiated run: pull `runAt` to now. Scoped to `QUEUED` so a `RUNNING` job under
 * an active lease can't be yanked out from under its worker. */
export async function runNow(jobId: string) {
  return prisma.job.updateMany({
    where: { id: jobId, status: JobStatus.QUEUED },
    data: { runAt: new Date() },
  });
}

/** Never removes a `RUNNING` job — that would delete the row a worker still holds a lease
 * on. `JobLog` and `JobArtifact` cascade with it. */
export async function remove(jobId: string) {
  return prisma.job.deleteMany({
    where: { id: jobId, status: { not: JobStatus.RUNNING } },
  });
}

export async function cancelQueuedForAccount(linkedInAccountId: string) {
  return prisma.job.updateMany({
    where: { linkedInAccountId, status: JobStatus.QUEUED },
    data: { status: JobStatus.CANCELLED, finishedAt: new Date() },
  });
}

/** Removes orphaned quota rows for a deleted account — RateBudget has no FK, so nothing cascades. */
export async function deleteRateBudgetsForAccount(linkedInAccountId: string) {
  return prisma.rateBudget.deleteMany({
    where: { scope: "linkedInAccount", scopeId: linkedInAccountId },
  });
}

export async function cancelQueuedForRun(runId: string) {
  return prisma.job.updateMany({
    where: { runId, status: JobStatus.QUEUED },
    data: { status: JobStatus.CANCELLED, finishedAt: new Date() },
  });
}

export async function countDead() {
  return prisma.job.count({ where: { status: JobStatus.DEAD } });
}

export async function listByStatus(status?: JobStatus, take = 50) {
  return prisma.job.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Manual retry from /jobs: resets attempts — a human retrying grants a fresh budget,
 * distinct from the reaper's automatic lease reclaim which leaves attempts untouched. */
export async function retryDeadJob(jobId: string) {
  return prisma.job.updateMany({
    where: { id: jobId, status: JobStatus.DEAD },
    data: {
      status: JobStatus.QUEUED,
      attempts: 0,
      lastError: null,
      finishedAt: null,
      runAt: new Date(),
    },
  });
}

export async function findExpiredRunning(limit: number) {
  return prisma.job.findMany({
    where: { status: JobStatus.RUNNING, leaseExpiresAt: { lt: new Date() } },
    take: limit,
  });
}

/** Reaper transition for one expired-lease job: back to QUEUED, or DEAD if attempts exhausted. */
export async function resetExpiredLease(job: {
  id: string;
  attempts: number;
  maxAttempts: number;
}) {
  const dead = job.attempts >= job.maxAttempts;
  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: dead ? JobStatus.DEAD : JobStatus.QUEUED,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      lastError: "Lease expired — reclaimed by scheduler reaper",
      finishedAt: dead ? new Date() : null,
    },
  });
}

export async function extendLease(jobId: string, workerId: string, leaseSeconds: number) {
  return prisma.job.updateMany({
    where: { id: jobId, lockedBy: workerId },
    data: { leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000) },
  });
}

export async function writeLog(params: {
  jobId: string;
  level?: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  data?: unknown;
}) {
  return prisma.jobLog.create({
    data: {
      jobId: params.jobId,
      level: params.level ?? "INFO",
      message: params.message,
      data: params.data as never,
    },
  });
}

export async function listLogs(jobId: string) {
  return prisma.jobLog.findMany({ where: { jobId }, orderBy: { at: "asc" } });
}

export async function listArtifacts(jobId: string) {
  return prisma.jobArtifact.findMany({
    where: { jobId },
    select: { id: true, kind: true, contentType: true, byteSize: true, capturedAt: true },
    orderBy: { capturedAt: "asc" },
  });
}

export async function getArtifact(id: string) {
  return prisma.jobArtifact.findUnique({ where: { id } });
}

/** Screenshot bytes are stored as-is; HTML is gzipped here (mirroring
 * `leadSnapshot.repository.ts`'s `create`) so the caller never has to remember to. */
export async function createArtifact(params: {
  jobId: string;
  kind: "SCREENSHOT" | "HTML";
  contentType: string;
  bytes: Buffer | Uint8Array;
}) {
  const raw =
    params.kind === JobArtifactKind.HTML ? gzipSync(Buffer.from(params.bytes)) : Buffer.from(params.bytes);
  return prisma.jobArtifact.create({
    data: {
      jobId: params.jobId,
      kind: params.kind,
      contentType: params.contentType,
      bytes: Uint8Array.from(raw),
      byteSize: raw.byteLength,
    },
  });
}
