import { logger } from "@/server/logger";
import { FatalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { searchPageFetchPayloadSchema } from "@/modules/jobs/domain/payloads";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as runRepo from "@/modules/search/repository/scrapeRun.repository";
import { upsertLeadFromSearchResult } from "@/modules/lead/service/upsertLeadFromSearchResult";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { consumeSearchPageBudget } from "@/scraper/guards/quota";
import { pageDelay } from "@/scraper/humanize/pacer";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { classifyResponse } from "@/scraper/session/detect";
import { extractSearchResults } from "@/scraper/extract/searchResult.extract";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import { handleRiskSignal } from "./shared/handleRiskSignal";
import { enqueueNextPageOrFinalize } from "./shared/enqueueNextPageOrFinalize";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";
import type { ScrapeRunModel } from "@/generated/prisma/models/ScrapeRun";

const log = logger.child({ handler: "search.page.fetch" });

export async function handleSearchPageFetch(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = searchPageFetchPayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid search.page.fetch payload", { issues: parsed.error.issues });
  }
  const { scrapeRunId, page } = parsed.data;

  const run = await runRepo.findById(scrapeRunId);
  if (!run) throw new FatalError(`ScrapeRun ${scrapeRunId} not found`);

  const lockResult = await withAccountLock(run.linkedInAccountId, () =>
    runFetch(run, page, job.id, signal),
  );
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function runFetch(
  run: ScrapeRunModel,
  page: number,
  jobId: string,
  signal: AbortSignal,
): Promise<void> {
  const accountId = run.linkedInAccountId;
  const prepared = await prepareAccountSession(accountId, new Date());
  if (!prepared.ok) {
    if (prepared.error.kind === "outside_active_hours") {
      throw new RescheduleError("Outside active hours", prepared.error.nextRunAt);
    }
    throw new FatalError(`Cannot prepare session: ${prepared.error.kind}`);
  }
  const { account, policy, fingerprint, proxy } = prepared.value;
  if (!account.storageStateSealed) {
    throw new RescheduleError(
      "No session yet — waiting for session.ensure",
      new Date(Date.now() + 60_000),
    );
  }
  const quota = await consumeSearchPageBudget({
    accountId,
    cap: policy.maxSearchPagesPerDay,
    now: new Date(),
  });
  if (!quota.ok) {
    throw new RescheduleError("Daily search-page quota exhausted", tomorrowUtc());
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
    await pageDelay({ min: policy.pageDelayMinMs, max: policy.pageDelayMaxMs }, signal);
    const url = `${run.searchUrl ?? ""}${run.searchUrl?.includes("?") ? "&" : "?"}page=${page}`;
    const pw = await context.newPage();
    await pw.goto(url, { waitUntil: "domcontentloaded" });

    const risk = await classifyResponse(pw);
    if (risk) {
      await runRepo.finalize(run.id, "HALTED", `risk signal: ${risk.kind}`);
      await handleRiskSignal({
        accountId,
        browser,
        context,
        risk,
        handlerName: "search.page.fetch",
        page: pw,
        jobId,
      });
    }

    const rows = extractSearchResults(await pw.content());
    let leadsNew = 0;
    for (const [i, row] of rows.entries()) {
      const result = await upsertLeadFromSearchResult({ row, runId: run.id, page, position: i });
      if (!result) continue;
      if (result.isNew) leadsNew++;
      await enqueueJob({
        type: "profile.scrape",
        payload: { scrapeRunId: run.id, leadId: result.leadId, profileUrl: row.profileUrl },
        runId: run.id,
        linkedInAccountId: accountId,
        idempotencyKey: `profile:${run.id}:${row.profileUrl}`,
      });
    }
    await runRepo.incrementCounters(run.id, { pagesDone: 1, leadsNew });
    await enqueueNextPageOrFinalize({ run, page, hasResults: rows.length > 0, accountId });

    const sealed = await sealStorageState(context);
    await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
    log.info({ scrapeRunId: run.id, page, rows: rows.length, leadsNew }, "search page fetched");
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
