import NextAuth from "next-auth";
import { authConfig } from "./authConfig";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
