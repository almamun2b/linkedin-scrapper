import { logger } from "@/server/logger";
import { unsealSecret } from "@/server/crypto/secretBox";
import { FatalError, RiskSignalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { sessionEnsurePayloadSchema } from "@/modules/jobs/domain/payloads";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import { hourBucketKey } from "@/modules/jobs/domain/idempotency";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as auditRepo from "@/modules/audit/repository/auditEvent.repository";
import { markActive, markChallenged } from "@/modules/linkedin-account/service/statusTransitions";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { containBreach } from "@/scraper/guards/circuitBreaker";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { ensureSession } from "@/scraper/session/ensureSession";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "session.ensure" });

/**
 * "The only job that may use the password; rare by design" (ARCHITECTURE.md §7). Loads
 * sealed storageState, tries a cheap authenticated check first, and only calls the login
 * page when that fails — never logs in at the start of every run.
 */
export async function handleSessionEnsure(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = sessionEnsurePayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid session.ensure payload", { issues: parsed.error.issues });
  }
  const { linkedInAccountId } = parsed.data;

  const lockResult = await withAccountLock(linkedInAccountId, () => runSession(linkedInAccountId, signal));
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function runSession(accountId: string, signal: AbortSignal): Promise<void> {
  const prepared = await prepareAccountSession(accountId, new Date());
  if (!prepared.ok) {
    if (prepared.error.kind === "outside_active_hours") {
      throw new RescheduleError("Outside active hours", prepared.error.nextRunAt);
    }
    throw new FatalError(`Cannot prepare session: ${prepared.error.kind}`);
  }
  const { account, policy, fingerprint, proxy } = prepared.value;

  const password = unsealSecret(account.passwordSealed, account.passwordKeyVer);
  const storageState = account.storageStateSealed
    ? unsealStorageState(account.storageStateSealed, account.storageStateKeyVer ?? 1)
    : undefined;

  const { browser, context } = await launchContextForAccount({
    headless: policy.headless,
    fingerprint,
    storageState,
    proxy,
  });

  try {
    const result = await ensureSession({
      context,
      email: account.email,
      password,
      stepDelayRange: { min: policy.stepDelayMinMs, max: policy.stepDelayMaxMs },
      signal,
    });

    if (!result.loggedIn) {
      const sealed = await containBreach({ browser, context });
      if (sealed) await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
      await markChallenged(accountId, `session.ensure risk: ${result.risk.kind} (${result.risk.details})`);
      await auditRepo.record({
        action: "linkedin_account.challenged",
        entity: "LinkedInAccount",
        entityId: accountId,
        data: result.risk,
      });
      throw new RiskSignalError(`Risk signal during session.ensure: ${result.risk.kind}`);
    }

    const sealed = await sealStorageState(context);
    await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
    await accountRepo.updateLastLogin(accountId);
    await markActive(accountId);

    if (result.profileUrl) {
      await enqueueJob({
        type: "profile.self.scrape",
        payload: { linkedInAccountId: accountId, profileUrl: result.profileUrl },
        linkedInAccountId: accountId,
        idempotencyKey: hourBucketKey("profile-self", accountId),
      });
    } else {
      log.warn({ accountId }, "logged in but could not discover own profile URL");
    }
  } finally {
    await browser.close().catch((error: unknown) => log.error({ err: error }, "failed to close browser"));
  }
}
