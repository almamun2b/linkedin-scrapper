import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as settingsRepo from "../repository/settings.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import {
  updateSystemSettingSchema,
  type UpdateSystemSettingInput,
} from "../domain/settings.schema";
import { invalidateSettingsCache } from "./getEffectiveSettings";

const log = logger.child({ module: "settings.updateSystemSetting" });

export interface UpdateSystemSettingError {
  kind: "invalid_input";
  issues: string[];
}

export async function updateSystemSetting(
  input: UpdateSystemSettingInput,
  actorId: string | null,
): Promise<Result<{ ok: true }, UpdateSystemSettingError>> {
  const parsed = updateSystemSettingSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }

  await settingsRepo.updateSystemSetting(parsed.data);
  invalidateSettingsCache();
  logger.level = parsed.data.logLevel;

  await auditRepo.record({
    actorId,
    action: "system_setting.updated",
    entity: "SystemSetting",
    entityId: "global",
    data: parsed.data,
  });

  log.info({}, "system setting updated");
  return ok({ ok: true });
}
