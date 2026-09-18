import bcrypt from "bcryptjs";
import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { changePasswordSchema, type ChangePasswordInput } from "../domain/user.schema";

const log = logger.child({ module: "user.changePassword" });

export type ChangePasswordError =
  | { kind: "invalid_input"; issues: string[] }
  | { kind: "not_found" }
  | { kind: "wrong_current_password" };

const BCRYPT_COST = 12;

/**
 * Two modes, chosen by the caller (the action, never the client): self mode verifies
 * `currentPassword` before rehashing, admin-reset mode skips that check for a *different*
 * user. An admin changing their own password always goes through self mode — admin status
 * does not let you skip your own current-password check.
 */
export async function changePassword(
  input: ChangePasswordInput,
  actorId: string | null,
  mode: "self" | "admin_reset",
): Promise<Result<{ id: string }, ChangePasswordError>> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { userId, currentPassword, newPassword } = parsed.data;

  const target = await userRepo.findByEmailForAuth((await userRepo.findById(userId))?.email ?? "");
  if (!target) {
    return err({ kind: "not_found" });
  }

  if (mode === "self") {
    if (!currentPassword || !target.passwordHash) {
      return err({ kind: "wrong_current_password" });
    }
    const matches = await bcrypt.compare(currentPassword, target.passwordHash);
    if (!matches) {
      return err({ kind: "wrong_current_password" });
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await userRepo.updatePassword(userId, passwordHash);

  await auditRepo.record({
    actorId,
    action: mode === "self" ? "user.password_changed" : "user.password_reset",
    entity: "User",
    entityId: userId,
  });

  log.info({ userId, mode }, "user password changed");
  return ok({ id: userId });
}
