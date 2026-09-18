"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createAccount } from "./service/createAccount";
import { deleteAccount } from "./service/deleteAccount";
import { updateAccountMeta } from "./service/updateAccountMeta";
import { requestTestConnection } from "./service/requestTestConnection";

/** Discriminates a real success from `useActionState`'s own initial `{}` — see the `Dialog`
 * primitive doc comment: a form inside a dialog closes on `state.ok`, and `{}` at rest must
 * never satisfy that check. */
export interface ActionState { ok?: true; error?: string }

export async function createAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const proxyIdRaw = formString(formData, "proxyId");
  const result = await createAccount(
    {
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      label: formString(formData, "label", "primary"),
      timezone: formString(formData, "timezone", "UTC"),
      proxyId: proxyIdRaw === "" ? undefined : proxyIdRaw === "none" ? null : proxyIdRaw,
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
  return { ok: true };
}

export async function updateAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const proxyIdRaw = formString(formData, "proxyId");
  await updateAccountMeta(
    {
      id: formString(formData, "id"),
      label: formString(formData, "label") || undefined,
      timezone: formString(formData, "timezone") || undefined,
      proxyId: proxyIdRaw === "" ? undefined : proxyIdRaw === "none" ? null : proxyIdRaw,
      password: formString(formData, "password") || undefined,
    },
    actor.id,
  );
  revalidatePath("/config/accounts");
  return { ok: true };
}

export async function testConnectionAction(accountId: string): Promise<{ queued: boolean }> {
  await requireRole("OPERATOR");
  return requestTestConnection(accountId);
}

export async function deleteAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await deleteAccount({ id: formString(formData, "id") }, actor.id);
  if (!result.ok) {
    if (result.error.kind === "not_found") {
      return { error: "Account not found — it may have been deleted already" };
    }
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/accounts");
  return { ok: true };
}

