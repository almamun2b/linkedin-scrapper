import { Role } from "@/generated/prisma/enums";
import { hasRequiredRole } from "../domain/roles";
import { auth } from "./auth";
import type { AppSessionUser } from "../domain/sessionUser";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * The first line of every Server Action, independent of any layout/middleware check
 * (CLAUDE.md invariant #5 — actions are directly addressable POST endpoints). Throws
 * rather than returning a Result: an unauthorized mutation attempt is a programmer/attacker
 * error, not an expected business outcome the caller should have to handle gracefully.
 */
export async function requireRole(minRole: keyof typeof Role): Promise<{ id: string; role: Role }> {
  const session = await auth();
  const user = session?.user as Partial<AppSessionUser> | undefined;
  if (!user?.id || !user.role) {
    throw new UnauthorizedError("Not signed in");
  }
  if (!hasRequiredRole(user.role, Role[minRole])) {
    throw new UnauthorizedError(`Requires role ${minRole} or higher`);
  }
  return { id: user.id, role: user.role };
}
