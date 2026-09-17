import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { deleteUserSchema, type DeleteUserInput } from "../domain/user.schema";

const log = logger.child({ module: "user.deleteUser" });

export type DeleteUserError =
  | { kind: "invalid_input"; issues: string[] }
  | { kind: "not_found" }
  | { kind: "self_delete" }
  | { kind: "last_admin" };

/**
 * Hard delete for a dashboard user. FK-safe (sessions/accounts cascade,
 * search/audit attribution nulls out), but the audit link to the deleted user
 * is lost — prefer Disable for normal offboarding.
 * Self-delete and deleting the last ADMIN are blocked.
 */
export async function deleteUser(
  input: DeleteUserInput,
  actorId: string | null,
): Promise<Result<{ id: string; email: string }, DeleteUserError>> {
  const parsed = deleteUserSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { userId } = parsed.data;

  if (actorId !== null && userId === actorId) {
    return err({ kind: "self_delete" });
  }

  const target = await userRepo.findById(userId);
  if (!target) {
    return err({ kind: "not_found" });
  }

  if (target.role === "ADMIN") {
    const adminCount = await userRepo.countAdmins();
    if (adminCount <= 1) {
      log.warn({ userId }, "user delete blocked: last admin");
      return err({ kind: "last_admin" });
    }
  }

  try {
    await userRepo.remove(userId);
  } catch (error) {
    if (isRecordNotFound(error)) {
      return err({ kind: "not_found" });
    }
    throw error;
  }

  await auditRepo.record({
    actorId,
    action: "user.deleted",
    entity: "User",
    entityId: userId,
    data: { email: target.email, role: target.role },
  });

  log.info({ userId, email: target.email }, "user deleted via /users");
  return ok({ id: userId, email: target.email });
}

function isRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
}
