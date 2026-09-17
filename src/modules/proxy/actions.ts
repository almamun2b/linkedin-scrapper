"use server";

import { revalidatePath } from "next/cache";
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
      label: String(formData.get("label") ?? ""),
      protocol: String(formData.get("protocol") ?? "HTTP") as never,
      host: String(formData.get("host") ?? ""),
      port: Number(formData.get("port") ?? 0),
      username: String(formData.get("username") ?? "") || undefined,
      password: String(formData.get("password") ?? "") || undefined,
      country: String(formData.get("country") ?? "") || undefined,
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
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? "") || undefined,
      host: String(formData.get("host") ?? "") || undefined,
      port: formData.get("port") ? Number(formData.get("port")) : undefined,
      country: String(formData.get("country") ?? "") || undefined,
      password: String(formData.get("password") ?? "") || undefined,
    },
    actor.id,
  );
  revalidatePath("/config/proxies");
}

export async function setProxyActiveAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (active) {
    await reactivateProxy(id, actor.id);
  } else {
    await deactivateProxy(id, actor.id);
  }
  revalidatePath("/config/proxies");
}
