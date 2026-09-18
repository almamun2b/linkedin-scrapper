import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { updateUserSchema, type UpdateUserInput } from "../domain/user.schema";

const log = logger.child({ module: "user.updateUser" });

export type UpdateUserError = { kind: "invalid_input"; issues: string[] } | { kind: "duplicate_email" };

/** Admin-only edit of another user's profile — mirrors `createUser.ts`'s duplicate-email
 * guard. Role changes go through this too so a single dialog covers name/email/role. */
export async function updateUser(
  input: UpdateUserInput,
  actorId: string | null,
): Promise<Result<{ id: string }, UpdateUserError>> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { userId, email, name, role } = parsed.data;

  const existing = await userRepo.findByEmail(email);
  if (existing && existing.id !== userId) {
    return err({ kind: "duplicate_email" });
  }

  const before = await userRepo.findById(userId);
  await userRepo.updateProfile(userId, { email, name });
  await userRepo.updateRole(userId, role);

  await auditRepo.record({
    actorId,
    action: "user.updated",
    entity: "User",
    entityId: userId,
    data: { email, name, roleFrom: before?.role ?? null, roleTo: role },
  });

  log.info({ userId, email, role }, "user updated");
  return ok({ id: userId });
}
