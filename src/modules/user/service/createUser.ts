import bcrypt from "bcryptjs";
import { logger } from "@/server/logger";
import { ok, err, type Result } from "@/server/result";
import * as userRepo from "../repository/user.repository";
import * as auditRepo from "../../audit/repository/auditEvent.repository";
import { createUserSchema, type CreateUserInput } from "../domain/user.schema";

const log = logger.child({ module: "user.createUser" });

export type CreateUserError = { kind: "invalid_input"; issues: string[] } | { kind: "duplicate_email" };

const BCRYPT_COST = 12;

export async function createUser(
  input: CreateUserInput,
  actorId: string | null,
): Promise<Result<{ id: string }, CreateUserError>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "invalid_input", issues: parsed.error.issues.map((i) => i.message) });
  }
  const { email, password, name, role } = parsed.data;

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return err({ kind: "duplicate_email" });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await userRepo.create({ email, passwordHash, name, role });

  await auditRepo.record({
    actorId,
    action: "user.created",
    entity: "User",
    entityId: user.id,
    data: { email, role },
  });

  log.info({ userId: user.id, email, role }, "user created");
  return ok({ id: user.id });
}
