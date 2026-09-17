import { logger } from "@/server/logger";
import * as searchRepo from "../repository/searchDefinition.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";

const log = logger.child({ module: "search.archiveSearchDefinition" });

/** Archives, never deletes — keeps run history meaningful (schema comment on SearchDefinition). */
export async function archiveSearchDefinition(id: string, actorId: string | null): Promise<void> {
  await searchRepo.archive(id);
  await auditRepo.record({
    actorId,
    action: "search_definition.archived",
    entity: "SearchDefinition",
    entityId: id,
  });
  log.info({ searchDefinitionId: id }, "search definition archived");
}
