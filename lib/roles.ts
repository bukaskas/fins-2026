/**
 * Role tier constants as plain strings, safe to import from the Edge runtime
 * (e.g. `middleware.ts`) where Prisma/bcrypt cannot be loaded.
 *
 * The values mirror the Prisma `Role` enum exactly. `lib/auth-guard.ts`
 * re-exports these typed as `Role[]` for use in server code.
 */
export const ADMIN_ROLES = ["ADMIN", "OWNER"] as const;

export const STAFF_ROLES = [
  "ADMIN",
  "OWNER",
  "STAFF",
  "ACCOUNTANT",
  "INSTRUCTOR",
] as const;

export type RoleName =
  | (typeof STAFF_ROLES)[number]
  | "RECEPTION"
  | "MEMBER"
  | "KITER"
  | "DAYPASS";
