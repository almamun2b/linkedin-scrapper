import { logger } from "@/server/logger";
import { sealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as settingsRepo from "../repository/settings.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import {
  updateScrapingPolicySchema,
  type UpdateScrapingPolicyInput,
} from "../domain/settings.schema";
import { invalidateSettingsCache } from "./getEffectiveSettings";

const log = logger.child({ module: "settings.updateScrapingPolicy" });

export interface UpdateScrapingPolicyError {
  kind: "invalid_input";
  issues: string[];
}

export async function updateScrapingPolicy(
  input: UpdateScrapingPolicyInput,
  actorId: string | null,
): Promise<Result<{ ok: true }, UpdateScrapingPolicyError>> {
  const parsed = updateScrapingPolicySchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { fallbackProxyUrl, ...patch } = parsed.data;

  await settingsRepo.updateScrapingPolicy({ ...patch, proxyCountry: patch.proxyCountry ?? null });
  if (fallbackProxyUrl) {
    const sealed = sealSecret(fallbackProxyUrl);
    await settingsRepo.updateFallbackProxyUrl(sealed.sealed, sealed.keyVer);
  }
  invalidateSettingsCache();

  await auditRepo.record({
    actorId,
    action: "scraping_policy.updated",
    entity: "ScrapingPolicy",
    entityId: "global",
    data: { ...patch, fallbackProxyUrlRotated: Boolean(fallbackProxyUrl) },
  });

  log.info({}, "scraping policy updated");
  return ok({ ok: true });
}
