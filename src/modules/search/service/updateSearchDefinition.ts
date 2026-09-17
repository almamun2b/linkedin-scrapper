import { z } from "zod";
import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as searchRepo from "../repository/searchDefinition.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { searchFiltersSchema } from "../domain/filters";

const log = logger.child({ module: "search.updateSearchDefinition" });

export const updateSearchDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  keywords: z.string().trim().max(200).optional(),
  filters: searchFiltersSchema.optional(),
  maxPages: z.coerce.number().int().min(1).max(50).optional(),
  enabled: z.coerce.boolean().optional(),
});
export type UpdateSearchDefinitionInput = z.infer<typeof updateSearchDefinitionSchema>;

export interface UpdateSearchDefinitionError {
  kind: "invalid_input";
  issues: string[];
}

export async function updateSearchDefinition(
  input: UpdateSearchDefinitionInput,
  actorId: string | null,
): Promise<Result<{ id: string }, UpdateSearchDefinitionError>> {
  const parsed = updateSearchDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { id, ...patch } = parsed.data;

  await searchRepo.update(id, patch);
  await auditRepo.record({
    actorId,
    action: "search_definition.updated",
    entity: "SearchDefinition",
    entityId: id,
    data: patch,
  });

  log.info({ searchDefinitionId: id }, "search definition updated");
  return ok({ id });
}
