import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as searchRepo from "../repository/searchDefinition.repository";
import * as runRepo from "../repository/scrapeRun.repository";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import { AccountStatus } from "@/generated/prisma/enums";
import { searchFiltersSchema } from "../domain/filters";
import { buildSearchUrl } from "../domain/buildSearchUrl";

const log = logger.child({ module: "search.startRun" });

export type StartRunError =
  { kind: "not_found" } | { kind: "account_not_scrapable"; status: AccountStatus };

/**
 * Preflight only — a soft check. The `run.start` job handler enforces the hard truth (it
 * re-reads the account's live status right before doing anything), so a status change
 * between this click and the job actually running can't be exploited.
 */
export async function startRun(
  searchDefinitionId: string,
  actorId: string | null,
): Promise<Result<{ scrapeRunId: string }, StartRunError>> {
  const definition = await searchRepo.findById(searchDefinitionId);
  if (!definition) return err({ kind: "not_found" });

  const account = await accountRepo.findById(definition.linkedInAccountId);
  if (!account) return err({ kind: "not_found" });
  const blocked: AccountStatus[] = [
    AccountStatus.RESTRICTED,
    AccountStatus.DISABLED,
    AccountStatus.CHALLENGED,
  ];
  if (blocked.includes(account.status)) {
    return err({ kind: "account_not_scrapable", status: account.status });
  }

  const filters = searchFiltersSchema.parse(definition.filters);
  const run = await runRepo.create({
    searchDefinitionId,
    linkedInAccountId: definition.linkedInAccountId,
    filtersSnapshot: filters,
    searchUrl: buildSearchUrl(filters, 1),
    maxPages: definition.maxPages,
  });

  await enqueueJob({
    type: "run.start",
    payload: { scrapeRunId: run.id },
    runId: run.id,
    linkedInAccountId: definition.linkedInAccountId,
    idempotencyKey: `run.start:${run.id}`,
  });

  await auditRepo.record({
    actorId,
    action: "scrape_run.started",
    entity: "ScrapeRun",
    entityId: run.id,
    data: { searchDefinitionId },
  });

  log.info({ scrapeRunId: run.id, searchDefinitionId }, "run queued");
  return ok({ scrapeRunId: run.id });
}
