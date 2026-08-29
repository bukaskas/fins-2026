/* eslint-disable no-console */
/**
 * Mint a NextAuth session cookie for local testing of auth-gated pages.
 *
 *   npx tsx scripts/dev-session.ts                     # first user with bookings:manage
 *   npx tsx scripts/dev-session.ts --role RECEPTION
 *   npx tsx scripts/dev-session.ts --email a@b.com
 *   npx tsx scripts/dev-session.ts --role RECEPTION --url /bookings
 *
 * Why this works without a password: the session strategy is JWT
 * (lib/auth.ts), so `getToken()` in proxy.ts and `getServerSession()` both read
 * a signed cookie rather than a session row. Signing one with NEXTAUTH_SECRET
 * is therefore equivalent to signing in, and needs no credentials and no
 * throwaway account.
 *
 * The token carries the user's real `sessionVersion`, because the jwt callback
 * re-checks it against the database every 10 minutes and strips the auth claims
 * if it disagrees. A hand-rolled token without it dies mid-session.
 *
 * Local only. Refuses to run against production, and prints a secret-bearing
 * cookie to stdout — don't paste the output anywhere shared.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Type-only: erased at runtime, so Prisma still loads lazily below.
import type { Role } from "@prisma/client";

// Load .env the same way the app would, without adding a dependency.
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!m) continue;
        const [, k, v] = m;
        if (process.env[k] === undefined) {
          process.env[k] = v.replace(/^['"]|['"]$/g, "");
        }
      }
    } catch {
      /* file absent is fine */
    }
  }
}
loadEnv();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("dev-session refuses to run with NODE_ENV=production.");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set (checked .env.local, .env).");

  const { prisma } = await import("@/db/prisma");
  const { encode } = await import("next-auth/jwt");
  const { CAPABILITIES } = await import("@/lib/permissions");

  const email = arg("email");
  const role = arg("role");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const path = arg("url") ?? "/bookings";

  const staffRoles = [...CAPABILITIES["bookings:manage"]] as Role[];
  const where: { email?: string; role?: Role | { in: Role[] } } = email
    ? { email: email.trim().toLowerCase() }
    : role
      ? { role: role.trim().toUpperCase() as Role }
      : { role: { in: staffRoles } };

  const user = await prisma.user.findFirst({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isInstructor: true,
      sessionVersion: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error(
      `No user matched ${JSON.stringify(where)}. Try --email or --role (e.g. --role ADMIN).`,
    );
  }

  const maxAge = 30 * 24 * 60 * 60;
  const token = await encode({
    secret,
    maxAge,
    token: {
      // Mirrors exactly what the jwt callback sets on a real sign-in.
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      isInstructor: user.isInstructor ?? false,
      sessionVersion: user.sessionVersion ?? 0,
      sessionVersionCheckedAt: Date.now(),
    },
  });

  // http in dev → unprefixed name. Production would be __Secure-…
  const cookieName = baseUrl.startsWith("https:")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  console.log(`\nUser    ${user.email}  (${user.role})`);
  console.log(`Cookie  ${cookieName}`);
  console.log(`\n--- curl ---`);
  console.log(`curl -s -b '${cookieName}=${token}' '${baseUrl}${path}' -o /dev/null -w '%{http_code}\\n'`);
  console.log(`\n--- cookie jar (reusable) ---`);
  console.log(`printf '%s\\tTRUE\\t/\\tFALSE\\t0\\t%s\\t%s\\n' localhost ${cookieName} '${token}' > /tmp/fins-cookies.txt`);
  console.log(`curl -s -b /tmp/fins-cookies.txt '${baseUrl}${path}'`);
  console.log(`\n--- browser: paste in DevTools console on ${baseUrl} ---`);
  console.log(`document.cookie = '${cookieName}=${token}; path=/'; location.href = '${path}';`);
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
