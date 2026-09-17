import { auth } from "./auth";
import type { AppSessionUser } from "../domain/sessionUser";

export async function getCurrentUser(): Promise<AppSessionUser | null> {
  const session = await auth();
  // next-auth's own `Session["user"]` type has no `role` — tsc genuinely needs this cast
  // (dropping it is a real TS2339 on `.role`) even though typescript-eslint's type-aware
  // no-unnecessary-type-assertion misflags it here.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const user = session?.user as Partial<AppSessionUser> | undefined;
  if (!user?.id || !user.role) return null;
  return { id: user.id, email: user.email ?? null, name: user.name ?? null, role: user.role };
}
