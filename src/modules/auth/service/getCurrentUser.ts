import { auth } from "./auth";
import type { AppSessionUser } from "../domain/sessionUser";

/**
 * UX-only helper — the dashboard layout's redirect check and pages conditionally rendering
 * mutation controls. Never a substitute for `requireRole` inside an actions.ts function
 * (CLAUDE.md invariant #5: every Server Action independently re-authorizes).
 */
export async function getCurrentUser(): Promise<AppSessionUser | null> {
  const session = await auth();
  const user = session?.user as Partial<AppSessionUser> | undefined;
  if (!user?.id || !user.role) return null;
  return { id: user.id, email: user.email ?? null, name: user.name ?? null, role: user.role };
}
