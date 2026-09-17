import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { loginSchema } from "../domain/login.schema";
import type { AppSessionUser } from "../domain/sessionUser";
import * as userRepo from "@/modules/user/repository/user.repository";

type TokenWithUser = { uid?: string; role?: AppSessionUser["role"] };

/**
 * `PrismaAdapter(prisma)` is the one narrow, named exception to "Prisma only in
 * repository/" (CLAUDE.md invariant #6) — it's the adapter package's own contract with
 * every NextAuth+Prisma integration, not a precedent for ad-hoc queries elsewhere. Session
 * strategy is JWT (not "database") so the adapter's Session table stays unused for now; it
 * exists only so a future OAuth provider can attach via Account without a schema change.
 *
 * `token`/`session.user` are cast to local shapes throughout rather than relying on
 * `declare module` augmentation of next-auth's JWT/Session/User — next-auth v5 re-exports
 * those interfaces from `@auth/core/jwt`/`@auth/core/types` via `export type {...}`, which
 * does not merge with an augmentation targeting "next-auth" itself (verified against the
 * installed package). Casting here, once, is more reliable than fighting that re-export chain.
 */
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await userRepo.findByEmailForAuth(email);
        if (!user || !user.passwordHash || user.disabledAt) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & TokenWithUser;
      if (user) {
        const u = user as unknown as AppSessionUser;
        t.uid = u.id;
        t.role = u.role;
        return t;
      }
      // Re-checked on every touch (not just at login) so an admin disabling/re-roling a
      // user takes effect immediately rather than waiting for the next sign-in. NextAuth's
      // JWT type has no "invalidate" return — instead we strip uid/role so the session
      // callback below (and requireRole/getCurrentUser) see an unauthenticated session.
      if (t.uid) {
        const current = await userRepo.findById(t.uid);
        if (!current || current.disabledAt) {
          delete t.uid;
          delete t.role;
          return t;
        }
        t.role = current.role;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & TokenWithUser;
      if (t.uid && t.role) {
        const sessionUser = session.user as unknown as AppSessionUser;
        sessionUser.id = t.uid;
        sessionUser.role = t.role;
      }
      return session;
    },
  },
};
