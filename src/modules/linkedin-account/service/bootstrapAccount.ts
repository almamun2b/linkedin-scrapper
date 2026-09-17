import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as policyRepo from "../repository/scrapingPolicy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { bootstrapInputSchema, type BootstrapInput } from "../domain/schema";
import { deriveInitialFingerprint } from "../domain/fingerprint";

const log = logger.child({ module: "linkedin-account.bootstrap" });

export type BootstrapError = { kind: "invalid_input"; issues: string[] };

/**
 * Idempotent by email: if the account already exists, returns it unchanged and does NOT
 * re-seal the password — a stale `.env` value on a repeat `db:seed` run must never silently
 * clobber a rotated real password. Only the first call for a given email actually creates
 * anything.
 */
export async function bootstrapAccountFromEnv(
  input: BootstrapInput,
): Promise<Result<{ id: string; email: string; status: string; created: boolean }, BootstrapError>> {
  const parsed = bootstrapInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { email, password, label } = parsed.data;

  const existing = await accountRepo.findByEmail(email);
  if (existing) {
    log.info({ accountId: existing.id, email }, "account already bootstrapped, leaving password untouched");
    return ok({ id: existing.id, email: existing.email, status: existing.status, created: false });
  }

  // passwordKeyVer defaults to 1 in the schema, matching sealSecret's current (only) key
  // version — see secretBox.ts for the key-rotation note.
  const { sealed } = sealSecret(password);
  const fingerprint = deriveInitialFingerprint(email);
  const account = await accountRepo.create({
    email,
    label,
    passwordSealed: sealed,
    fingerprint,
  });

  await policyRepo.upsertDefaultForAccount(account.id);
  await auditRepo.record({
    action: "linkedin_account.bootstrapped",
    entity: "LinkedInAccount",
    entityId: account.id,
    data: { email, label },
  });

  log.info({ accountId: account.id, email }, "account bootstrapped");
  return ok({ id: account.id, email: account.email, status: account.status, created: true });
}
