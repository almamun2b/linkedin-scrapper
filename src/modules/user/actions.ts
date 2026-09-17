"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createUser } from "./service/createUser";
import { updateRole } from "./service/updateRole";
import { setDisabled } from "./service/setDisabled";

export async function createUserAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await createUser(
    {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "") || undefined,
      role: String(formData.get("role") ?? "VIEWER") as never,
    },
    actor.id,
  );
  if (!result.ok) {
    const message = result.error.kind === "duplicate_email" ? "A user with that email already exists" : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/users");
  return {};
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await updateRole(
    { userId: String(formData.get("userId") ?? ""), role: String(formData.get("role") ?? "") as never },
    actor.id,
  );
  revalidatePath("/users");
}

export async function setUserDisabledAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await setDisabled(
    { userId: String(formData.get("userId") ?? ""), disabled: formData.get("disabled") === "true" },
    actor.id,
  );
  revalidatePath("/users");
}
