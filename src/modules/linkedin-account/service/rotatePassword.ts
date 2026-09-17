import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { rotatePasswordSchema, type RotatePasswordInput } from "../domain/schema";

const log = logger.child({ module: "linkedin-account.rotatePassword" });

export interface RotatePasswordError {
  kind: "invalid_input";
  issues: string[];
}

/**
 * Reseals the password only — does NOT touch storageState. A stale session still needs
 * re-login regardless; session.ensure detects that itself next run rather than this action
 * guessing at it.
 */
export async function rotatePassword(
  input: RotatePasswordInput,
  actorId: string | null,
): Promise<Result<{ id: string }, RotatePasswordError>> {
  const parsed = rotatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { id, password } = parsed.data;

  const { sealed, keyVer } = sealSecret(password);
  await accountRepo.updatePasswordSealed(id, sealed, keyVer);
  await auditRepo.record({
    actorId,
    action: "linkedin_account.password_rotated",
    entity: "LinkedInAccount",
    entityId: id,
  });

  log.info({ accountId: id }, "password rotated");
  return ok({ id });
}
