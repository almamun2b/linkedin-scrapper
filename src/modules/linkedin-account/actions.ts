"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createAccount } from "./service/createAccount";
import { deleteAccount } from "./service/deleteAccount";
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
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      label: formString(formData, "label", "primary"),
      timezone: formString(formData, "timezone", "UTC"),
    },
    actor.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "duplicate_email"
        ? "An account with that email already exists"
        : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/config/accounts");
  return {};
}

export async function updateAccountAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const proxyIdRaw = formString(formData, "proxyId");
  await updateAccountMeta(
    {
      id: formString(formData, "id"),
      label: formString(formData, "label") || undefined,
      timezone: formString(formData, "timezone") || undefined,
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
    { id: formString(formData, "id"), password: formString(formData, "password") },
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

export async function deleteAccountAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await deleteAccount({ id: formString(formData, "id") }, actor.id);
  if (!result.ok) {
    if (result.error.kind === "not_found") {
      return { error: "Account not found — it may have been deleted already" };
    }
    if (result.error.kind === "blocked_by_history") {
      const { searches, runs } = result.error;
      return {
        error: `Cannot delete — ${searches} search(es) and ${runs} run(s) still reference this account`,
      };
    }
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/accounts");
  return {};
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
      linkedInAccountId: formString(formData, "linkedInAccountId"),
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
