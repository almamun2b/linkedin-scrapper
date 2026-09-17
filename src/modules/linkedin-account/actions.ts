"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createAccount } from "./service/createAccount";
import { updateAccountMeta } from "./service/updateAccountMeta";
import { rotatePassword } from "./service/rotatePassword";
import { requestTestConnection } from "./service/requestTestConnection";
import { updatePolicy } from "./service/updatePolicy";

export async function createAccountAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await createAccount(
    {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      label: String(formData.get("label") ?? "primary"),
      timezone: String(formData.get("timezone") ?? "UTC"),
    },
    actor.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "duplicate_email" ? "An account with that email already exists" : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/config/accounts");
  return {};
}

export async function updateAccountAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const proxyIdRaw = String(formData.get("proxyId") ?? "");
  await updateAccountMeta(
    {
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? "") || undefined,
      timezone: String(formData.get("timezone") ?? "") || undefined,
      proxyId: proxyIdRaw === "" ? undefined : proxyIdRaw === "none" ? null : proxyIdRaw,
    },
    actor.id,
  );
  revalidatePath("/config/accounts");
}

export async function rotatePasswordAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await rotatePassword(
    { id: String(formData.get("id") ?? ""), password: String(formData.get("password") ?? "") },
    actor.id,
  );
  if (!result.ok) {
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/accounts");
  return {};
}

export async function testConnectionAction(accountId: string): Promise<{ queued: boolean }> {
  await requireRole("OPERATOR");
  return requestTestConnection(accountId);
}

function num(formData: FormData, name: string): number {
  return Number(formData.get(name) ?? 0);
}

export async function updatePolicyAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  // Checkboxes are absent from FormData entirely when unchecked — read presence explicitly
  // rather than spreading formData.entries() into the schema.
  const result = await updatePolicy(
    {
      linkedInAccountId: String(formData.get("linkedInAccountId") ?? ""),
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
    },
    actor.id,
  );
  if (!result.ok) {
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/policy");
  return {};
}
