import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as searchRepo from "../../search/repository/searchDefinition.repository";
import * as runRepo from "../../search/repository/scrapeRun.repository";
import * as jobsRepo from "../../jobs/repository/jobs.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { deleteAccountSchema, type DeleteAccountInput } from "../domain/schema";

const log = logger.child({ module: "linkedin-account.deleteAccount" });

export type DeleteAccountError =
  | { kind: "invalid_input"; issues: string[] }
  | { kind: "not_found" }
  | { kind: "blocked_by_history"; searches: number; runs: number };

/**
 * Hard delete for an unused account. SearchDefinition/ScrapeRun are onDelete: Restrict by
 * design (history must not vanish silently), so a used account is blocked with counts rather
 * than cascaded. QUEUED jobs are cancelled first (same call the breaker uses) and orphaned
 * RateBudget rows are removed since that table has no FK to cascade.
 */
export async function deleteAccount(
  input: DeleteAccountInput,
  actorId: string | null,
): Promise<Result<{ id: string; email: string; label: string }, DeleteAccountError>> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { id } = parsed.data;

  const account = await accountRepo.findById(id);
  if (!account) {
    return err({ kind: "not_found" });
  }

  const [searches, runs] = await Promise.all([
    searchRepo.countByAccount(id),
    runRepo.countByAccount(id),
  ]);
  if (searches > 0 || runs > 0) {
    log.warn({ accountId: id, searches, runs }, "account delete blocked by referencing history");
    return err({ kind: "blocked_by_history", searches, runs });
  }

  await jobsRepo.cancelQueuedForAccount(id);
  await jobsRepo.deleteRateBudgetsForAccount(id);

  try {
    await accountRepo.remove(id);
  } catch (error) {
    if (isRecordNotFound(error)) {
      return err({ kind: "not_found" });
    }
    if (isForeignKeyViolation(error)) {
      // A search/run landed between the count check and the delete — report, don't leak P2003.
      const [retrySearches, retryRuns] = await Promise.all([
        searchRepo.countByAccount(id),
        runRepo.countByAccount(id),
      ]);
      log.warn(
        { accountId: id, searches: retrySearches, runs: retryRuns },
        "account delete raced referencing history",
      );
      return err({ kind: "blocked_by_history", searches: retrySearches, runs: retryRuns });
    }
    throw error;
  }

  await auditRepo.record({
    actorId,
    action: "linkedin_account.deleted",
    entity: "LinkedInAccount",
    entityId: id,
    data: { email: account.email, label: account.label },
  });

  log.info({ accountId: id, email: account.email }, "account deleted via /config");
  return ok({ id, email: account.email, label: account.label });
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2003";
}

function isRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
}
