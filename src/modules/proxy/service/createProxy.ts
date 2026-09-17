import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as proxyRepo from "../repository/proxy.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { createProxySchema, type CreateProxyInput } from "../domain/proxy.schema";

const log = logger.child({ module: "proxy.createProxy" });

export type CreateProxyError = { kind: "invalid_input"; issues: string[] };

export async function createProxy(
  input: CreateProxyInput,
  actorId: string | null,
): Promise<Result<{ id: string }, CreateProxyError>> {
  const parsed = createProxySchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { label, protocol, host, port, username, password, country } = parsed.data;

  const sealed = password ? sealSecret(password) : null;
  const proxy = await proxyRepo.create({
    label,
    protocol,
    host,
    port,
    username: username ?? null,
    passwordSealed: sealed?.sealed ?? null,
    passwordKeyVer: sealed?.keyVer ?? null,
    country: country ?? null,
  });

  await auditRepo.record({
    actorId,
    action: "proxy.created",
    entity: "Proxy",
    entityId: proxy.id,
    data: { label, protocol, host, port, country },
  });

  log.info({ proxyId: proxy.id, label }, "proxy created");
  return ok({ id: proxy.id });
}
