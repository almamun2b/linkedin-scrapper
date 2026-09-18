"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createProxy } from "./service/createProxy";
import { updateProxy } from "./service/updateProxy";
import { deactivateProxy, reactivateProxy } from "./service/deactivateProxy";

export interface ActionState { ok?: true; error?: string }

export async function createProxyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
  return { ok: true };
}

export async function updateProxyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const result = await updateProxy(
    {
      id: formString(formData, "id"),
      label: formString(formData, "label") || undefined,
      protocol: (formString(formData, "protocol") || undefined) as never,
      host: formString(formData, "host") || undefined,
      port: formData.get("port") ? Number(formData.get("port")) : undefined,
      username: formString(formData, "username") || undefined,
      country: formString(formData, "country") || undefined,
      password: formString(formData, "password") || undefined,
    },
    actor.id,
  );
  if (!result.ok) {
    const message =
      result.error.kind === "not_found" ? "Proxy not found" : result.error.issues.join(", ");
    return { error: message };
  }
  revalidatePath("/config/proxies");
  return { ok: true };
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
