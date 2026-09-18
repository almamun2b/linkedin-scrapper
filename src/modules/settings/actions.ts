"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { updateScrapingPolicy } from "./service/updateScrapingPolicy";
import { updateSystemSetting } from "./service/updateSystemSetting";

export interface ActionState { ok?: true; error?: string }

function num(formData: FormData, name: string): number {
  return Number(formData.get(name) ?? 0);
}

export async function updateScrapingPolicyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  // Checkboxes are absent from FormData entirely when unchecked — read presence explicitly.
  const result = await updateScrapingPolicy(
    {
      stepDelayMinMs: num(formData, "stepDelayMinMs"),
      stepDelayMaxMs: num(formData, "stepDelayMaxMs"),
      profileDelayMinMs: num(formData, "profileDelayMinMs"),
      profileDelayMaxMs: num(formData, "profileDelayMaxMs"),
      pageDelayMinMs: num(formData, "pageDelayMinMs"),
      pageDelayMaxMs: num(formData, "pageDelayMaxMs"),
      sessionBreakAfter: num(formData, "sessionBreakAfter"),
      sessionBreakMinMs: num(formData, "sessionBreakMinMs"),
      sessionBreakMaxMs: num(formData, "sessionBreakMaxMs"),
      maxProfilesPerDay: num(formData, "maxProfilesPerDay"),
      maxSearchPagesPerDay: num(formData, "maxSearchPagesPerDay"),
      maxProfilesPerWeek: num(formData, "maxProfilesPerWeek"),
      activeHoursStart: num(formData, "activeHoursStart"),
      activeHoursEnd: num(formData, "activeHoursEnd"),
      activeOnWeekends: formData.has("activeOnWeekends"),
      useProxy: formData.has("useProxy"),
      headless: formData.has("headless"),
      fallbackProxyUrl: formString(formData, "fallbackProxyUrl") || undefined,
      proxyCountry: formString(formData, "proxyCountry") || undefined,
    },
    actor.id,
  );
  if (!result.ok) {
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/policy");
  return { ok: true };
}

export async function updateSystemSettingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await updateSystemSetting(
    {
      workerId: formString(formData, "workerId"),
      workerConcurrency: num(formData, "workerConcurrency"),
      workerQueues: formString(formData, "workerQueues"),
      pollIntervalMs: num(formData, "pollIntervalMs"),
      leaseSeconds: num(formData, "leaseSeconds"),
      leaseHeartbeatMs: num(formData, "leaseHeartbeatMs"),
      shutdownGraceMs: num(formData, "shutdownGraceMs"),
      logLevel: formString(formData, "logLevel") as never,
      displayTimezone: formString(formData, "displayTimezone"),
    },
    actor.id,
  );
  if (!result.ok) {
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/system");
  return { ok: true };
}
