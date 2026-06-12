import "server-only";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import {
  ADMIN_ROLES as ADMIN_ROLE_NAMES,
  STAFF_ROLES as STAFF_ROLE_NAMES,
} from "@/lib/roles";

/** Roles allowed to manage users (create/update/delete, export PII). */
export const ADMIN_ROLES: Role[] = ADMIN_ROLE_NAMES as readonly string[] as Role[];

/** Roles that operate the internal back-office (bookings, lessons, accounting). */
export const STAFF_ROLES: Role[] = STAFF_ROLE_NAMES as readonly string[] as Role[];

/** Returns the current session user's role, or null if not signed in. */
export async function currentRole(): Promise<Role | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as { role?: Role } | undefined)?.role ?? null) as
    | Role
    | null;
}

/** True if the signed-in user holds one of the allowed roles. */
export async function hasRole(allowed: Role[]): Promise<boolean> {
  const role = await currentRole();
  return !!role && allowed.includes(role);
}

/**
 * Throws "Not authorized" unless the signed-in user holds an allowed role.
 * Use in server components / reads where an error boundary or page guard
 * handles the failure.
 */
export async function requireRole(allowed: Role[]): Promise<void> {
  if (!(await hasRole(allowed))) {
    throw new Error("Not authorized");
  }
}

/**
 * Page-level guard for server components: redirects unauthorized visitors to
 * sign-in instead of throwing, for a clean UX. Returns nothing on success.
 */
export async function requireRolePage(allowed: Role[]): Promise<void> {
  if (!(await hasRole(allowed))) {
    redirect("/signin");
  }
}
