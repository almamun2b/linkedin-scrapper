"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole, UnauthorizedError } from "@/modules/auth/service/requireRole";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import { createUser } from "./service/createUser";
import { updateUser } from "./service/updateUser";
import { setDisabled } from "./service/setDisabled";
import { deleteUser } from "./service/deleteUser";
import { changePassword } from "./service/changePassword";

export interface ActionState { ok?: true; error?: string }

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await createUser(
    {
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      name: formString(formData, "name") || undefined,
      role: formString(formData, "role", "VIEWER") as never,
    },
    actor.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "duplicate_email"
        ? "A user with that email already exists"
        : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/users");
  return { ok: true };
}

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await updateUser(
    {
      userId: formString(formData, "userId"),
      email: formString(formData, "email"),
      name: formString(formData, "name") || undefined,
      role: formString(formData, "role") as never,
    },
    actor.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "duplicate_email"
        ? "A user with that email already exists"
        : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/users");
  return { ok: true };
}

export async function updateMeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Identity comes from the session, never from the form — a signed-in user may only ever
  // edit themselves through this action (CLAUDE.md invariant #5: re-authorize, don't trust
  // a hidden field an attacker controls just as easily as the visible ones).
  const me = await getCurrentUser();
  if (!me) throw new UnauthorizedError("Not signed in");
  const result = await updateUser(
    {
      userId: me.id,
      email: formString(formData, "email"),
      name: formString(formData, "name") || undefined,
      role: me.role,
    },
    me.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "duplicate_email"
        ? "A user with that email already exists"
        : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/users");
  return { ok: true };
}

/** Self for the caller's own id, admin-reset for anyone else — the mode is decided here
 * from who the actor is, never taken from the client. */
export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("VIEWER");
  const targetUserId = formString(formData, "userId") || actor.id;
  if (targetUserId !== actor.id) {
    await requireRole("ADMIN");
  }
  const mode = targetUserId === actor.id ? "self" : "admin_reset";
  const result = await changePassword(
    {
      userId: targetUserId,
      currentPassword: formString(formData, "currentPassword") || undefined,
      newPassword: formString(formData, "newPassword"),
    },
    actor.id,
    mode,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "wrong_current_password"
        ? "Current password is incorrect"
        : result.error.kind === "not_found"
          ? "User not found"
          : result.error.issues.join(", ");
    return { error: message };
  }
  return { ok: true };
}

export async function setUserDisabledAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await setDisabled(
    { userId: formString(formData, "userId"), disabled: formData.get("disabled") === "true" },
    actor.id,
  );
  revalidatePath("/users");
}

export async function deleteUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await deleteUser({ userId: formString(formData, "userId") }, actor.id);
  if (!result.ok) {
    if (result.error.kind === "not_found") {
      return { error: "User not found — it may have been deleted already" };
    }
    if (result.error.kind === "self_delete") {
      return { error: "You cannot delete your own account" };
    }
    if (result.error.kind === "last_admin") {
      return { error: "Cannot delete the last admin user" };
    }
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/users");
  return { ok: true };
}
