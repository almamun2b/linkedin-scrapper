import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as proxyRepo from "../../proxy/repository/proxy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { updateAccountMetaSchema, type UpdateAccountMetaInput } from "../domain/schema";

const log = logger.child({ module: "linkedin-account.updateAccountMeta" });

export interface UpdateAccountMetaError {
  kind: "invalid_input";
  issues: string[];
}

/**
 * Assigning a proxy already used by another account is allowed (the schema permits sharing
 * by design — ARCHITECTURE §9 layer 2) but surfaced as a warning here, never a DB constraint.
 */
export async function updateAccountMeta(
  input: UpdateAccountMetaInput,
  actorId: string | null,
): Promise<Result<{ id: string; sharedByCount: number | null }, UpdateAccountMetaError>> {
  const parsed = updateAccountMetaSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { id, label, timezone, proxyId } = parsed.data;

  await accountRepo.updateMeta(id, { label, timezone, proxyId });
  await auditRepo.record({
    actorId,
    action: "linkedin_account.updated",
    entity: "LinkedInAccount",
    entityId: id,
    data: { label, timezone, proxyId },
  });

  let sharedByCount: number | null = null;
  if (proxyId) {
    sharedByCount = await proxyRepo.countAccountsUsing(proxyId);
  }

  log.info({ accountId: id }, "account meta updated");
  return ok({ id, sharedByCount });
}
