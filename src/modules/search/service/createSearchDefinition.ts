import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as searchRepo from "../repository/searchDefinition.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { searchFiltersSchema } from "../domain/filters";
import { z } from "zod";

const log = logger.child({ module: "search.createSearchDefinition" });

export const createSearchDefinitionSchema = z.object({
  name: z.string().trim().min(1),
  linkedInAccountId: z.string().min(1),
  keywords: z.string().trim().max(200).optional(),
  filters: searchFiltersSchema,
  maxPages: z.coerce.number().int().min(1).max(50).default(5),
});
// z.input, not z.infer/z.output — maxPages has a `.default()`, so the OUTPUT type makes it
// required; callers (actions.ts) pass the pre-parse shape where it's still optional.
export type CreateSearchDefinitionInput = z.input<typeof createSearchDefinitionSchema>;

export type CreateSearchDefinitionError = { kind: "invalid_input"; issues: string[] };

export async function createSearchDefinition(
  input: CreateSearchDefinitionInput,
  actorId: string | null,
): Promise<Result<{ id: string }, CreateSearchDefinitionError>> {
  const parsed = createSearchDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }

  const definition = await searchRepo.create({ ...parsed.data, createdById: actorId });
  await auditRepo.record({
    actorId,
    action: "search_definition.created",
    entity: "SearchDefinition",
    entityId: definition.id,
    data: { name: parsed.data.name },
  });

  log.info({ searchDefinitionId: definition.id }, "search definition created");
  return ok({ id: definition.id });
}
