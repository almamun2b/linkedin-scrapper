"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createProxy } from "./service/createProxy";
import { updateProxy } from "./service/updateProxy";
import { deactivateProxy, reactivateProxy } from "./service/deactivateProxy";

export async function createProxyAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await createProxy(
    {
      label: formString(formData, "label"),
      protocol: formString(formData, "protocol", "HTTP") as never,
      host: formString(formData, "host"),
      port: Number(formData.get("port") ?? 0),
      username: formString(formData, "username") || undefined,
      password: formString(formData, "password") || undefined,
      country: formString(formData, "country") || undefined,
    },
    actor.id,
  );
  if (!result.ok) {
    return { error: result.error.issues.join(", ") };
  }
  revalidatePath("/config/proxies");
  return {};
}

export async function updateProxyAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await updateProxy(
    {
      id: formString(formData, "id"),
      label: formString(formData, "label") || undefined,
      host: formString(formData, "host") || undefined,
      port: formData.get("port") ? Number(formData.get("port")) : undefined,
      country: formString(formData, "country") || undefined,
      password: formString(formData, "password") || undefined,
    },
    actor.id,
  );
  revalidatePath("/config/proxies");
}

export async function setProxyActiveAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const id = formString(formData, "id");
  const active = formData.get("active") === "true";
  if (active) {
    await reactivateProxy(id, actor.id);
  } else {
    await deactivateProxy(id, actor.id);
  }
  revalidatePath("/config/proxies");
}
