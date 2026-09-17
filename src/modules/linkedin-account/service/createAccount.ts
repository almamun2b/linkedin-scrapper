import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as policyRepo from "../repository/scrapingPolicy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { createAccountSchema, type CreateAccountInput } from "../domain/schema";
import { deriveInitialFingerprint } from "../domain/fingerprint";

const log = logger.child({ module: "linkedin-account.createAccount" });

export type CreateAccountError =
  { kind: "invalid_input"; issues: string[] } | { kind: "duplicate_email" };

/**
 * The only way a LinkedInAccount row gets created — there is no env-based bootstrap path
 * (ARCHITECTURE.md §10: the database is the source of truth, managed from /config). NOT
 * silently idempotent: a genuine duplicate email from an admin filling out this form is a
 * validation error to surface, not a no-op to swallow.
 */
export async function createAccount(
  input: CreateAccountInput,
  actorId: string | null,
): Promise<Result<{ id: string }, CreateAccountError>> {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { email, password, label, timezone } = parsed.data;

  const existing = await accountRepo.findByEmail(email);
  if (existing) {
    return err({ kind: "duplicate_email" });
  }

  const { sealed } = sealSecret(password);
  const fingerprint = deriveInitialFingerprint(email);
  const account = await accountRepo.create({ email, label, passwordSealed: sealed, fingerprint });
  await accountRepo.updateMeta(account.id, { timezone });
  await policyRepo.upsertDefaultForAccount(account.id);
  await auditRepo.record({
    actorId,
    action: "linkedin_account.created",
    entity: "LinkedInAccount",
    entityId: account.id,
    data: { email, label },
  });

  log.info({ accountId: account.id, email }, "account created via /config");
  return ok({ id: account.id });
}
