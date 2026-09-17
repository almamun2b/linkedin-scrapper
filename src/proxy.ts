import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/service/auth";

/**
 * Redirect-only UX (send an anonymous visitor to /login before the page even renders, and a
 * signed-in visitor away from /login) — this is explicitly NOT the authorization boundary.
 * Every Server Action still calls `requireRole` independently (CLAUDE.md invariant #5); a bug
 * here narrows or widens who gets redirected, never who is allowed to mutate anything.
 *
 * Named proxy.ts, not middleware.ts — Next.js 16 deprecated the "middleware" file convention
 * in favor of "proxy" (same location/shape, just renamed).
 */
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
