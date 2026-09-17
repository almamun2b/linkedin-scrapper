import { logger } from "@/server/logger";
import { FatalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { profileScrapePayloadSchema } from "@/modules/jobs/domain/payloads";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { touchActivity } from "@/modules/linkedin-account/service/statusTransitions";
import { recordProfileScrape } from "@/modules/lead/service/recordProfileScrape";
import { extractPublicIdentifier } from "@/modules/lead/domain/lead.schema";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { consumeDailyProfileBudget } from "@/scraper/guards/quota";
import { profileDelay } from "@/scraper/humanize/pacer";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { classifyResponse } from "@/scraper/session/detect";
import { openProfile } from "@/scraper/pages/profile.page";
import { openContactInfoPanel } from "@/scraper/pages/contactInfo.panel";
import { extractProfileFields } from "@/scraper/extract/profile.extract";
import { extractContactInfo } from "@/scraper/extract/contactInfo.extract";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import { handleRiskSignal } from "./shared/handleRiskSignal";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "profile.scrape" });

/** Generic profile visit — the quota-consuming unit for any lead, not just the account's own. */
export async function handleProfileScrape(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = profileScrapePayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid profile.scrape payload", { issues: parsed.error.issues });
  }
  const { scrapeRunId, profileUrl } = parsed.data;

  const publicIdentifier = extractPublicIdentifier(profileUrl);
  if (!publicIdentifier) {
    throw new FatalError(`Cannot extract publicIdentifier from ${profileUrl}`);
  }

  const linkedInAccountId = job.linkedInAccountId;
  if (!linkedInAccountId) {
    throw new FatalError("profile.scrape job missing linkedInAccountId");
  }

  const lockResult = await withAccountLock(linkedInAccountId, () =>
    runScrape(linkedInAccountId, scrapeRunId, publicIdentifier, profileUrl, signal),
  );
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function runScrape(
  accountId: string,
  scrapeRunId: string,
  publicIdentifier: string,
  profileUrl: string,
  signal: AbortSignal,
): Promise<void> {
  const prepared = await prepareAccountSession(accountId, new Date());
  if (!prepared.ok) {
    if (prepared.error.kind === "outside_active_hours") {
      throw new RescheduleError("Outside active hours", prepared.error.nextRunAt);
    }
    throw new FatalError(`Cannot prepare session: ${prepared.error.kind}`);
  }
  const { account, policy, fingerprint, proxy } = prepared.value;
  if (!account.storageStateSealed) {
    throw new RescheduleError("No session yet — waiting for session.ensure", new Date(Date.now() + 60_000));
  }

  const quota = await consumeDailyProfileBudget({ accountId, cap: policy.maxProfilesPerDay, now: new Date() });
  if (!quota.ok) {
    throw new RescheduleError("Daily profile quota exhausted", tomorrowUtc());
  }

  const storageState = unsealStorageState(account.storageStateSealed, account.storageStateKeyVer ?? 1);
  const { browser, context } = await launchContextForAccount({ headless: policy.headless, fingerprint, storageState, proxy });

  try {
    await profileDelay({ min: policy.profileDelayMinMs, max: policy.profileDelayMaxMs }, signal);
    const page = await context.newPage();
    const html = await openProfile(page, profileUrl);
    const risk = await classifyResponse(page);
    if (risk) {
      await handleRiskSignal({ accountId, browser, context, risk, handlerName: "profile.scrape" });
    }

    const fields = extractProfileFields(html);
    const contactInfoHtml = await openContactInfoPanel(page).catch(() => null);
    const contactInfo = contactInfoHtml ? extractContactInfo(contactInfoHtml) : undefined;

    await recordProfileScrape({
      publicIdentifier,
      runId: scrapeRunId,
      profileHtml: html,
      fields,
      contactInfoHtml: contactInfoHtml ?? undefined,
      contactInfo,
    });
    const sealed = await sealStorageState(context);
    await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
    await touchActivity(accountId);
    log.info({ accountId, publicIdentifier, hasEmail: Boolean(contactInfo?.email) }, "profile scraped");
  } finally {
    await browser.close().catch((error: unknown) => log.error({ err: error }, "failed to close browser"));
  }
}

function tomorrowUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}
