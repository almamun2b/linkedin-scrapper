import { prisma } from "@/server/db/prisma";
import type { Role } from "@/generated/prisma/enums";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name?: string;
  role: Role;
}

/** Web-safe: `passwordHash` stays excluded via the client-level `omit` in server/db/prisma.ts. */
export async function list() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export type UserListItem = Awaited<ReturnType<typeof list>>[number];

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/** Auth-only — the one sanctioned place that opts back into `passwordHash`, mirroring
 * linkedInAccount.repository.ts's `findForWorker` pattern. Never call this from a UI page. */
export async function findByEmailForAuth(email: string) {
  return prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
}

export async function create(input: CreateUserData) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role,
    },
  });
}

export async function updateRole(userId: string, role: Role) {
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function setDisabled(userId: string, disabled: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: disabled ? new Date() : null },
  });
}

export async function countAdmins() {
  return prisma.user.count({ where: { role: "ADMIN" } });
}

/**
 * Hard delete. FK-safe by design: Account/Session cascade, while
 * SearchDefinition.createdById and AuditEvent.actorId are SetNull so history
 * survives with a null actor. Prefer Disable for normal offboarding —
 * delete is for never-used / mistaken accounts.
 */
export async function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}
