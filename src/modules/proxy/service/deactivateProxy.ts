import { logger } from "@/server/logger";
import * as proxyRepo from "../repository/proxy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";

const log = logger.child({ module: "proxy.deactivateProxy" });

/**
 * Deactivate, not delete — deleting a Proxy sets any assigned LinkedInAccount.proxyId to
 * null (onDelete: SetNull), silently orphaning the assignment. Deactivating leaves it visible
 * as "inactive proxy assigned" for an admin to consciously fix.
 */
export async function deactivateProxy(id: string, actorId: string | null): Promise<void> {
  await proxyRepo.setActive(id, false);
  await auditRepo.record({ actorId, action: "proxy.deactivated", entity: "Proxy", entityId: id });
  log.info({ proxyId: id }, "proxy deactivated");
}

export async function reactivateProxy(id: string, actorId: string | null): Promise<void> {
  await proxyRepo.setActive(id, true);
  await auditRepo.record({ actorId, action: "proxy.reactivated", entity: "Proxy", entityId: id });
  log.info({ proxyId: id }, "proxy reactivated");
}
