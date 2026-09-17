import { gzipSync } from "node:zlib";
import { logger } from "@/server/logger";
import { FatalError, RiskSignalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { profileSelfScrapePayloadSchema } from "@/modules/jobs/domain/payloads";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as auditRepo from "@/modules/audit/repository/auditEvent.repository";
import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";
import {
  markChallenged,
  touchActivity,
} from "@/modules/linkedin-account/service/statusTransitions";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { containBreach } from "@/scraper/guards/circuitBreaker";
import { consumeDailyProfileBudget } from "@/scraper/guards/quota";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { classifyResponse } from "@/scraper/session/detect";
import { openProfile } from "@/scraper/pages/profile.page";
import { extractProfileFields } from "@/scraper/extract/profile.extract";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "profile.self.scrape" });

/**
 * Quota-consuming proof step: navigates to the account's own profile (found by
 * session.ensure), extracts basic fields, and stores a raw capture in JobLog for offline
 * selector fixes later (CLAUDE.md invariant #7's minimal-correct form — see the plan's
 * decision notes on why this isn't a Lead/LeadSnapshot row).
 */
export async function handleProfileSelfScrape(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = profileSelfScrapePayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid profile.self.scrape payload", { issues: parsed.error.issues });
  }
  const { linkedInAccountId, profileUrl } = parsed.data;

  const lockResult = await withAccountLock(linkedInAccountId, () =>
    runScrape(job.id, linkedInAccountId, profileUrl, signal),
  );
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function runScrape(
  jobId: string,
  accountId: string,
  profileUrl: string,
  signal: AbortSignal,
): Promise<void> {
  void signal; // no in-page cancellation checkpoints yet — a single navigation is quick
  const prepared = await prepareAccountSession(accountId, new Date());
  if (!prepared.ok) {
    if (prepared.error.kind === "outside_active_hours") {
      throw new RescheduleError("Outside active hours", prepared.error.nextRunAt);
    }
    throw new FatalError(`Cannot prepare session: ${prepared.error.kind}`);
  }
  const { account, policy, fingerprint, proxy } = prepared.value;

  const quota = await consumeDailyProfileBudget({
    accountId,
    cap: policy.maxProfilesPerDay,
    now: new Date(),
  });
  if (!quota.ok) {
    throw new RescheduleError("Daily profile quota exhausted", tomorrowUtc());
  }
  if (!account.storageStateSealed) {
    throw new FatalError("No session yet — session.ensure must run first");
  }

  const storageState = unsealStorageState(
    account.storageStateSealed,
    account.storageStateKeyVer ?? 1,
  );
  const { browser, context } = await launchContextForAccount({
    headless: policy.headless,
    fingerprint,
    storageState,
    proxy,
  });

  try {
    const page = await context.newPage();
    const html = await openProfile(page, profileUrl);
    const risk = await classifyResponse(page);
    if (risk) {
      const sealed = await containBreach({ browser, context });
      if (sealed) await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
      await markChallenged(accountId, `profile.self.scrape risk: ${risk.kind} (${risk.details})`);
      await auditRepo.record({
        action: "linkedin_account.challenged",
        entity: "LinkedInAccount",
        entityId: accountId,
        data: risk,
      });
      throw new RiskSignalError(`Risk signal during profile.self.scrape: ${risk.kind}`);
    }

    const fields = extractProfileFields(html);
    await jobsRepo.writeLog({
      jobId,
      message: "profile.self.captured",
      data: {
        parsed: fields,
        raw: {
          encoding: "gzip+base64",
          html: gzipSync(Buffer.from(html, "utf8")).toString("base64"),
        },
      },
    });

    const sealed = await sealStorageState(context);
    await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
    await touchActivity(accountId);
    log.info({ accountId, fullName: fields.fullName }, "self profile captured");
  } finally {
    await browser.close().catch((error: unknown) => {
      log.error({ err: error }, "failed to close browser");
    });
  }
}

function tomorrowUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}
