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
  | { kind: "not_found" };

/**
 * Hard delete with cascade. SearchDefinition/ScrapeRun are onDelete: Cascade, so deleting
 * the account removes its searches and runs (and their RunLead join rows) in the same
 * statement. Leads and LeadSnapshots survive: Lead.firstSeenRun, LeadSnapshot.run, and
 * Job.run/linkedInAccountId are SetNull, never Cascade. QUEUED jobs are cancelled first
 * (same call the breaker uses) and orphaned RateBudget rows are removed since that table
 * has no FK to cascade.
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

  await jobsRepo.cancelQueuedForAccount(id);
  await jobsRepo.deleteRateBudgetsForAccount(id);

  try {
    await accountRepo.remove(id);
  } catch (error) {
    if (isRecordNotFound(error)) {
      return err({ kind: "not_found" });
    }
    throw error;
  }

  await auditRepo.record({
    actorId,
    action: "linkedin_account.deleted",
    entity: "LinkedInAccount",
    entityId: id,
    data: { email: account.email, label: account.label, searches, runs },
  });

  log.info({ accountId: id, email: account.email, searches, runs }, "account deleted via /config");
  return ok({ id, email: account.email, label: account.label });
}

function isRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
}
