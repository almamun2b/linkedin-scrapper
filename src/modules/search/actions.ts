"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import { createSearchDefinition } from "./service/createSearchDefinition";
import { updateSearchDefinition } from "./service/updateSearchDefinition";
import { archiveSearchDefinition } from "./service/archiveSearchDefinition";
import { startRun } from "./service/startRun";
import { cancelRun } from "./service/cancelRun";
import { requestTypeaheadResolution } from "./service/resolveTypeahead";
import type { SearchFilters } from "./domain/filters";
import type { FilterRefKind } from "@/generated/prisma/enums";
import * as filterRefRepo from "./repository/filterRef.repository";

/** Read-only, DB-only lookup for the inline typeahead picker — no role gate, any signed-in user. */
export async function searchFilterRefAction(kind: FilterRefKind, query: string) {
  if (!query.trim()) return [];
  const rows = await filterRefRepo.searchCached(kind, query);
  return rows.map((r) => ({ label: r.label, urn: r.urn }));
}

export async function createSearchDefinitionAction(input: {
  name: string;
  linkedInAccountId: string;
  keywords?: string;
  filters: SearchFilters;
  maxPages?: number;
}): Promise<{ error?: string; id?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await createSearchDefinition(input, actor.id);
  if (!result.ok) return { error: result.error.issues.join(", ") };
  revalidatePath("/searches");
  return { id: result.value.id };
}

export async function updateSearchDefinitionAction(input: {
  id: string;
  name?: string;
  keywords?: string;
  filters?: SearchFilters;
  maxPages?: number;
  enabled?: boolean;
}): Promise<{ error?: string }> {
  const actor = await requireRole("ADMIN");
  const result = await updateSearchDefinition(input, actor.id);
  if (!result.ok) return { error: result.error.issues.join(", ") };
  revalidatePath("/searches");
  revalidatePath(`/searches/${input.id}`);
  return {};
}

export async function archiveSearchDefinitionAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  await archiveSearchDefinition(formString(formData, "id"), actor.id);
  revalidatePath("/searches");
}

export async function startRunAction(
  formData: FormData,
): Promise<{ error?: string; scrapeRunId?: string }> {
  const actor = await requireRole("OPERATOR");
  const result = await startRun(formString(formData, "searchDefinitionId"), actor.id);
  if (!result.ok) {
    const message =
      result.error.kind === "account_not_scrapable"
        ? `LinkedIn account is ${result.error.status} — cannot start a run`
        : "Search definition not found";
    return { error: message };
  }
  revalidatePath("/runs");
  return { scrapeRunId: result.value.scrapeRunId };
}

export async function cancelRunAction(formData: FormData): Promise<void> {
  const actor = await requireRole("OPERATOR");
  await cancelRun(formString(formData, "runId"), actor.id);
  revalidatePath("/runs");
}

export async function requestTypeaheadResolutionAction(params: {
  linkedInAccountId: string;
  kind: FilterRefKind;
  query: string;
}): Promise<{ queued: boolean }> {
  await requireRole("OPERATOR");
  return requestTypeaheadResolution(params);
}
