import { logger } from "@/server/logger";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import { hourBucketKey } from "@/modules/jobs/domain/idempotency";

const log = logger.child({ module: "linkedin-account.requestTestConnection" });

/**
 * The "Test connection" button (ARCHITECTURE §2): enqueues a session.ensure job — the web
 * process never opens a browser itself, it only inserts one Job row.
 */
export async function requestTestConnection(
  linkedInAccountId: string,
): Promise<{ queued: boolean }> {
  const job = await enqueueJob({
    type: "session.ensure",
    payload: { linkedInAccountId, bypassActiveHours: true },
    linkedInAccountId,
    idempotencyKey: hourBucketKey("session-ensure", linkedInAccountId),
  });
  log.info({ linkedInAccountId, queued: Boolean(job) }, "test connection requested");
  return { queued: Boolean(job) };
}
