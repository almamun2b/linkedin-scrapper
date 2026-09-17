import bcrypt from "bcryptjs";
import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { Role } from "@/generated/prisma/enums";

const log = logger.child({ module: "user.bootstrapAdmin" });
const BCRYPT_COST = 12;

export type BootstrapAdminError = { kind: "invalid_input"; issues: string[] };

/**
 * Idempotent by email, mirroring bootstrapAccountFromEnv: if ADMIN_EMAIL already has a User
 * row, it's left untouched (a repeat `db:seed` must never silently reset a rotated password).
 */
export async function bootstrapAdminUserFromEnv(input: {
  email: string;
  password: string;
}): Promise<Result<{ id: string; email: string; created: boolean }, BootstrapAdminError>> {
  const { email, password } = input;
  if (!email.includes("@") || password.length < 8) {
    return err({
      kind: "invalid_input",
      issues: ["ADMIN_EMAIL must be a valid email and ADMIN_PASSWORD must be at least 8 characters"],
    });
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    log.info({ userId: existing.id, email }, "admin user already bootstrapped, leaving untouched");
    return ok({ id: existing.id, email: existing.email, created: false });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await userRepo.create({ email, passwordHash, role: Role.ADMIN });
  await auditRepo.record({
    action: "user.bootstrapped",
    entity: "User",
    entityId: user.id,
    data: { email, role: Role.ADMIN },
  });

  log.info({ userId: user.id, email }, "admin user bootstrapped");
  return ok({ id: user.id, email: user.email, created: true });
}
