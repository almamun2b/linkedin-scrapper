import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as proxyRepo from "../repository/proxy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { updateProxySchema, type UpdateProxyInput } from "../domain/proxy.schema";

const log = logger.child({ module: "proxy.updateProxy" });

export type UpdateProxyError = { kind: "invalid_input"; issues: string[] } | { kind: "not_found" };

export async function updateProxy(
  input: UpdateProxyInput,
  actorId: string | null,
): Promise<Result<{ id: string }, UpdateProxyError>> {
  const parsed = updateProxySchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { id, label, protocol, host, port, username, password, country } = parsed.data;

  const existing = await proxyRepo.findById(id);
  if (!existing) {
    return err({ kind: "not_found" });
  }

  const sealed = password ? sealSecret(password) : undefined;
  await proxyRepo.update(id, {
    label,
    protocol,
    host,
    port,
    username,
    country,
    ...(sealed ? { passwordSealed: sealed.sealed, passwordKeyVer: sealed.keyVer } : {}),
  });

  await auditRepo.record({
    actorId,
    action: "proxy.updated",
    entity: "Proxy",
    entityId: id,
    data: { label, protocol, host, port, country, passwordRotated: Boolean(password) },
  });

  log.info({ proxyId: id }, "proxy updated");
  return ok({ id });
}
