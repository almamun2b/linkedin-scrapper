import { prisma } from "../prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { JobStatus } from "../../../generated/prisma/enums";

export interface ClaimedJob {
  id: string;
  queue: string;
  type: string;
  payload: unknown;
  status: JobStatus;
  priority: number;
  runAt: Date;
  attempts: number;
  maxAttempts: number;
  idempotencyKey: string | null;
  runId: string | null;
  linkedInAccountId: string | null;
  lastError: string | null;
  createdAt: Date;
  finishedAt: Date | null;
}

/**
 * ARCHITECTURE.md §6.1: a single `FOR UPDATE SKIP LOCKED` claim, one `queue` at a time
 * (never `ANY($1)`), predicate + ORDER BY matching the [queue,status,priority,runAt] index
 * exactly. CLAUDE.md invariant #6 — every identifier quoted, since Postgres would otherwise
 * fold these camelCase/PascalCase names to lowercase and silently miss the real columns.
 */
export async function claimJobs(params: {
  queue: string;
  workerId: string;
  leaseSeconds: number;
  limit: number;
}): Promise<ClaimedJob[]> {
  const { queue, workerId, leaseSeconds, limit } = params;
  return prisma.$queryRaw<ClaimedJob[]>(Prisma.sql`
    UPDATE "Job"
    SET "status" = 'RUNNING',
        "lockedBy" = ${workerId},
        "lockedAt" = now(),
        "leaseExpiresAt" = now() + (${leaseSeconds} * interval '1 second'),
        "attempts" = "attempts" + 1
    WHERE "id" IN (
      SELECT "id" FROM "Job"
      WHERE "queue" = ${queue} AND "status" = 'QUEUED' AND "runAt" <= now()
      ORDER BY "priority" ASC, "runAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "queue", "type", "payload", "status", "priority", "runAt", "attempts",
              "maxAttempts", "idempotencyKey", "runId", "linkedInAccountId", "lastError",
              "createdAt", "finishedAt";
  `);
}
