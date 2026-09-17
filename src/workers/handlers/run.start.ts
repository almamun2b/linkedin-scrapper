import { logger } from "@/server/logger";
import { FatalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { runStartPayloadSchema } from "@/modules/jobs/domain/payloads";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import * as runRepo from "@/modules/search/repository/scrapeRun.repository";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as policyRepo from "@/modules/linkedin-account/repository/scrapingPolicy.repository";
import { isWithinActiveHours, nextWindowStart } from "@/scraper/guards/activeHours";
import { AccountStatus } from "@/generated/prisma/enums";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "run.start" });

/** No browser — just the preflight + kickoff (ARCHITECTURE §7's job table). */
export async function handleRunStart(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  void signal;
  const parsed = runStartPayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid run.start payload", { issues: parsed.error.issues });
  }
  const { scrapeRunId } = parsed.data;

  const run = await runRepo.findById(scrapeRunId);
  if (!run) {
    throw new FatalError(`ScrapeRun ${scrapeRunId} not found`);
  }
  const account = await accountRepo.findById(run.linkedInAccountId);
  const policy = await policyRepo.findByAccountId(run.linkedInAccountId);
  if (!account || !policy) {
    throw new FatalError(`Account or policy missing for ScrapeRun ${scrapeRunId}`);
  }

  const blocked: AccountStatus[] = [AccountStatus.RESTRICTED, AccountStatus.DISABLED, AccountStatus.CHALLENGED];
  if (blocked.includes(account.status)) {
    await runRepo.finalize(scrapeRunId, "HALTED", `account status is ${account.status}`);
    throw new FatalError(`Account ${account.id} is ${account.status} — cannot run`);
  }

  const activeHoursPolicy = {
    activeHoursStart: policy.activeHoursStart,
    activeHoursEnd: policy.activeHoursEnd,
    activeOnWeekends: policy.activeOnWeekends,
  };
  const now = new Date();
  if (!isWithinActiveHours(now, activeHoursPolicy, account.timezone)) {
    throw new RescheduleError("Outside active hours", nextWindowStart(now, activeHoursPolicy, account.timezone));
  }

  await runRepo.markRunning(scrapeRunId);
  await enqueueJob({
    type: "session.ensure",
    payload: { linkedInAccountId: account.id },
    linkedInAccountId: account.id,
    idempotencyKey: `session-ensure:${account.id}:run:${scrapeRunId}`,
  });
  await enqueueJob({
    type: "search.page.fetch",
    payload: { scrapeRunId, page: 1 },
    runId: scrapeRunId,
    linkedInAccountId: account.id,
    idempotencyKey: `search.page:${scrapeRunId}:1`,
  });

  log.info({ scrapeRunId }, "run started, session.ensure + page 1 queued");
}
