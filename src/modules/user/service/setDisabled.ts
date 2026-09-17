import { logger } from "@/server/logger";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { setDisabledSchema, type SetDisabledInput } from "../domain/user.schema";

const log = logger.child({ module: "user.setDisabled" });

export async function setDisabled(input: SetDisabledInput, actorId: string | null): Promise<void> {
  const { userId, disabled } = setDisabledSchema.parse(input);
  await userRepo.setDisabled(userId, disabled);
  await auditRepo.record({
    actorId,
    action: disabled ? "user.disabled" : "user.enabled",
    entity: "User",
    entityId: userId,
  });
  log.info({ userId, disabled }, "user disabled state changed");
}
