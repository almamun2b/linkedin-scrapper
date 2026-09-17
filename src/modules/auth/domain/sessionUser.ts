import type { Role } from "@/generated/prisma/enums";

/**
 * The shape this app actually puts on a session, kept as a local type rather than relying on
 * `declare module` augmentation of next-auth's Session/JWT/User — verified that next-auth v5
 * re-exports those interfaces from `@auth/core/types`/`@auth/core/jwt` via `export type {...}`,
 * which does not merge with an augmentation targeting "next-auth" itself. Casting at the one
 * boundary (authConfig.ts) where session/token/user actually flow through is more reliable
 * than fighting that re-export chain.
 */
export interface AppSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
}
