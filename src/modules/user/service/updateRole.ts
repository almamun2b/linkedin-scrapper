import { logger } from "@/server/logger";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { updateRoleSchema, type UpdateRoleInput } from "../domain/user.schema";

const log = logger.child({ module: "user.updateRole" });

export async function updateRole(input: UpdateRoleInput, actorId: string | null): Promise<void> {
  const { userId, role } = updateRoleSchema.parse(input);
  const before = await userRepo.findById(userId);
  await userRepo.updateRole(userId, role);
  await auditRepo.record({
    actorId,
    action: "user.role_changed",
    entity: "User",
    entityId: userId,
    data: { from: before?.role ?? null, to: role },
  });
  log.info({ userId, from: before?.role, to: role }, "user role changed");
}
