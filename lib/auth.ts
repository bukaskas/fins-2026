import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";


import { prisma } from "@/db/prisma";
import { verifyPassword } from "@/lib/password";

// How often a live JWT is re-validated against the DB. A password reset bumps
// User.sessionVersion, so stolen/old sessions lose their auth claims within
// this window.
const SESSION_VERSION_RECHECK_MS = 10 * 60 * 1000;

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // refresh session once per day
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });
        if (!user || !user.password) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          isInstructor: user.isInstructor,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.isInstructor = (user as any).isInstructor ?? false;
        token.sessionVersion = (user as any).sessionVersion ?? 0;
        token.sessionVersionCheckedAt = Date.now();
        return token;
      }

      // Periodic re-validation: if the account's sessionVersion moved on
      // (password reset) or the user is gone, strip the auth claims so role
      // guards and `session.user.id` consumers reject the session.
      const checkedAt = (token.sessionVersionCheckedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - checkedAt > SESSION_VERSION_RECHECK_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionVersion: true, role: true, isInstructor: true },
          });
          const tokenVersion = (token.sessionVersion as number | undefined) ?? 0;
          if (!dbUser || dbUser.sessionVersion !== tokenVersion) {
            delete token.id;
            delete token.role;
            delete token.isInstructor;
            delete token.sessionVersion;
          } else {
            // Pick up role/instructor changes while we're here.
            token.role = dbUser.role;
            token.isInstructor = dbUser.isInstructor;
            token.sessionVersionCheckedAt = Date.now();
          }
        } catch (error) {
          // DB hiccup: keep the token; the next call re-checks.
          console.error("[auth] sessionVersion re-check failed:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isInstructor = token.isInstructor ?? false;
      }
      return session;
    },
  },
};
