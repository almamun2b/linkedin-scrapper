import { logger } from "@/server/logger";
import * as accountRepo from "../repository/linkedInAccount.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { canTransition } from "../domain/statusTransitions";
import { AccountStatus } from "../../../generated/prisma/enums";

const log = logger.child({ module: "linkedin-account.status" });

async function transition(id: string, to: AccountStatus, reason?: string): Promise<void> {
  const account = await accountRepo.findById(id);
  if (!account) {
    throw new Error(`LinkedInAccount ${id} not found`);
  }
  if (!canTransition(account.status, to)) {
    log.warn({ accountId: id, from: account.status, to }, "disallowed status transition, ignoring");
    return;
  }
  await accountRepo.updateStatus(id, to, reason);
  await auditRepo.record({
    action: "linkedin_account.status_changed",
    entity: "LinkedInAccount",
    entityId: id,
    data: { from: account.status, to, reason },
  });
  log.info({ accountId: id, from: account.status, to }, "status changed");
}

export async function markActive(id: string): Promise<void> {
  await transition(id, AccountStatus.ACTIVE);
}

export async function markChallenged(id: string, reason: string): Promise<void> {
  await transition(id, AccountStatus.CHALLENGED, reason);
}

export async function touchActivity(id: string): Promise<void> {
  await accountRepo.updateLastActivity(id);
}
