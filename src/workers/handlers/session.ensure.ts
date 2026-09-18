import { logger } from "@/server/logger";
import { unsealSecret } from "@/server/crypto/secretBox";
import {
  FatalError,
  RescheduleError,
  RetryableError,
  RiskSignalError,
} from "@/modules/jobs/domain/errors";
import { sessionEnsurePayloadSchema } from "@/modules/jobs/domain/payloads";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import { hourBucketKey } from "@/modules/jobs/domain/idempotency";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { markActive } from "@/modules/linkedin-account/service/statusTransitions";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { ensureSession } from "@/scraper/session/ensureSession";
import { LoginInteractionError } from "@/scraper/pages/login.page";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import { handleRiskSignal, captureEvidence } from "./shared/handleRiskSignal";
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
  const { linkedInAccountId, bypassActiveHours } = parsed.data;

  const lockResult = await withAccountLock(linkedInAccountId, () =>
    runSession(linkedInAccountId, job.id, bypassActiveHours, signal),
  );
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function runSession(
  accountId: string,
  jobId: string,
  bypassActiveHours: boolean,
  signal: AbortSignal,
): Promise<void> {
  const prepared = await prepareAccountSession(accountId, new Date(), bypassActiveHours);
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
      // handleRiskSignal always throws — this `return` is unreachable at runtime but tells
      // the type checker the block exits, so `result` narrows to `loggedIn: true` below
      // (a `Promise<never>` return type alone isn't enough for control-flow narrowing here).
      await handleRiskSignal({
        accountId,
        browser,
        context,
        risk: result.risk,
        handlerName: "session.ensure",
        page: result.page,
        jobId,
      });
      return;
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
  } catch (error) {
    if (
      error instanceof FatalError ||
      error instanceof RiskSignalError ||
      error instanceof RetryableError ||
      error instanceof RescheduleError
    ) {
      throw error;
    }
    if (error instanceof LoginInteractionError) {
      await captureEvidence(jobId, error.page, {
        kind: "login_interaction_error",
        details: error.message,
      });
    }
    // A bare Error out of ensureSession/login (e.g. a selector not found) is permanent for
    // this payload, not transient — classify it as fatal so it goes to DEAD instead of
    // retrying indefinitely against the real login page (errors.ts: "selector broke ...
    // goes to DEAD immediately").
    throw new FatalError(
      error instanceof Error ? error.message : "session.ensure failed",
      { cause: error },
    );
  } finally {
    await browser.close().catch((error: unknown) => {
      log.error({ err: error }, "failed to close browser");
    });
  }
}
