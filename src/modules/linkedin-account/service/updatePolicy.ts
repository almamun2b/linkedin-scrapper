import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as policyRepo from "../repository/scrapingPolicy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { updatePolicySchema, type UpdatePolicyInput } from "../domain/scrapingPolicy.schema";

const log = logger.child({ module: "linkedin-account.updatePolicy" });

export type UpdatePolicyError = { kind: "invalid_input"; issues: string[] };

export async function updatePolicy(
  input: UpdatePolicyInput,
  actorId: string | null,
): Promise<Result<{ linkedInAccountId: string }, UpdatePolicyError>> {
  const parsed = updatePolicySchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { linkedInAccountId, ...patch } = parsed.data;

  await policyRepo.update(linkedInAccountId, patch);
  await auditRepo.record({
    actorId,
    action: "scraping_policy.updated",
    entity: "ScrapingPolicy",
    entityId: linkedInAccountId,
    data: patch,
  });

  log.info({ linkedInAccountId }, "scraping policy updated");
  return ok({ linkedInAccountId });
}
