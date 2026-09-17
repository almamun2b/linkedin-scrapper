import { logger } from "@/server/logger";
import { FatalError, RescheduleError } from "@/modules/jobs/domain/errors";
import { searchTypeaheadResolvePayloadSchema } from "@/modules/jobs/domain/payloads";
import * as filterRefRepo from "@/modules/search/repository/filterRef.repository";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { withAccountLock } from "@/scraper/guards/accountLock";
import { launchContextForAccount } from "@/scraper/browser/launch";
import { sealStorageState, unsealStorageState } from "@/scraper/session/storageState";
import { stepDelay } from "@/scraper/humanize/pacer";
import { prepareAccountSession } from "./shared/prepareAccountSession";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";

const log = logger.child({ handler: "search.typeahead.resolve" });

/**
 * TODO(human): the actual LinkedIn typeahead endpoint/selectors this handler needs are
 * UNVERIFIED and cannot be confirmed by an agent (CLAUDE.md invariant #10 — no agent may
 * load real linkedin.com markup). Before this handler can succeed against real traffic,
 * open LinkedIn's own search filter picker in your browser's devtools while logged in,
 * find the GraphQL/REST request its typeahead box makes for the given filter kind (geo,
 * company, etc.), and replace the `resolve()` stub below with real navigation + parsing —
 * the surrounding lock/session/pacing/FilterRef-upsert plumbing is already correct and
 * reusable as-is.
 */
export async function handleSearchTypeaheadResolve(job: ClaimedJob, signal: AbortSignal): Promise<void> {
  const parsed = searchTypeaheadResolvePayloadSchema.safeParse(job.payload);
  if (!parsed.success) {
    throw new FatalError("Invalid search.typeahead.resolve payload", { issues: parsed.error.issues });
  }
  const { linkedInAccountId, kind, query } = parsed.data;

  const lockResult = await withAccountLock(linkedInAccountId, () => resolve(linkedInAccountId, kind, query, signal));
  if (!lockResult.ok) {
    throw new RescheduleError("Account lock unavailable", new Date(Date.now() + 15_000));
  }
}

async function resolve(
  accountId: string,
  kind: Parameters<typeof filterRefRepo.upsertMany>[0],
  query: string,
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
    throw new RescheduleError("No session yet", new Date(Date.now() + 60_000));
  }

  const storageState = unsealStorageState(account.storageStateSealed, account.storageStateKeyVer ?? 1);
  const { browser, context } = await launchContextForAccount({ headless: policy.headless, fingerprint, storageState, proxy });

  try {
    await stepDelay({ min: policy.stepDelayMinMs, max: policy.stepDelayMaxMs }, signal);

    // TODO(human): replace with the real typeahead request/parse for `kind`/`query`.
    log.warn({ kind, query }, "search.typeahead.resolve endpoint not yet implemented — see file header");
    const results: Array<{ label: string; urn: string }> = [];

    if (results.length > 0) {
      await filterRefRepo.upsertMany(kind, results);
    }

    const sealed = await sealStorageState(context);
    await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
  } finally {
    await browser.close().catch((error: unknown) => log.error({ err: error }, "failed to close browser"));
  }
}
