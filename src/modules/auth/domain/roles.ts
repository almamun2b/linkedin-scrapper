import { Role } from "@/generated/prisma/enums";

/** Higher rank can do everything a lower rank can — see CLAUDE.md's Server Action invariant. */
export const ROLE_RANK: Record<Role, number> = {
  [Role.VIEWER]: 0,
  [Role.OPERATOR]: 1,
  [Role.ADMIN]: 2,
};

export function hasRequiredRole(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
