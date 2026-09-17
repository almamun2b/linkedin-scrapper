"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createUser } from "./service/createUser";
import { updateRole } from "./service/updateRole";
import { setDisabled } from "./service/setDisabled";
import { deleteUser } from "./service/deleteUser";

export async function createUserAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
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
  return {};
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await updateRole(
    { userId: formString(formData, "userId"), role: formString(formData, "role") as never },
    actor.id,
  );
  revalidatePath("/users");
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
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
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
  return {};
}
