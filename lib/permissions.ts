/**
 * Capability map: which roles may perform which group of operations.
 *
 * Plain strings (no Prisma imports) so this is safe to load from the Edge
 * runtime (`proxy.ts`) as well as server code. The values mirror the Prisma
 * `Role` enum exactly — `lib/auth-guard.ts` layers typed helpers on top.
 *
 * Guards should ask for a capability (`requireCapability("bookings:manage")`),
 * not a role list — adding a new role is then a change to this file only.
 */
export const CAPABILITIES = {
  /** Bookings CRUD, status changes, deposits, closed dates, bulk emails. */
  "bookings:manage": ["ADMIN", "OWNER", "STAFF", "RECEPTION"],
  /** Front desk: guest lookup/creation, beach-use check-in. */
  "desk:checkin": ["ADMIN", "OWNER", "STAFF", "RECEPTION"],
  /** Walk-in payments: settle open orders at the desk (D2). Not payment
   *  editing, reports, or expenses — those stay accounting:manage. */
  "desk:collect": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "RECEPTION"],
  /** See the lesson schedule board and session details. */
  "lessons:view": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "INSTRUCTOR", "RECEPTION"],
  /** Add a guest to an existing session (charges the guest) (D3). */
  "lessons:book": ["ADMIN", "OWNER", "STAFF", "RECEPTION"],
  /** Create/edit/delete sessions and lesson bookings. */
  "lessons:manage": ["ADMIN", "OWNER", "STAFF"],
  /** Rentals checkout/return/cancel (D1: reception excluded). */
  "rentals:manage": ["ADMIN", "OWNER", "STAFF"],
  /** Inventory items and stock adjustments. */
  "inventory:manage": ["ADMIN", "OWNER", "STAFF"],
  /** Read the product catalog (pickers in desk/lesson/order flows). */
  "products:view": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "RECEPTION"],
  /** Create/edit/deactivate products. */
  "products:manage": ["ADMIN", "OWNER", "STAFF"],
  /** Orders, payment editing, payment reports, expenses. */
  "accounting:manage": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"],
  /** Instructor commissions and payouts. */
  "instructors:manage": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"],
  /** User administration (create/update/delete, PII export). */
  "users:admin": ["ADMIN", "OWNER"],
} as const;

export type Capability = keyof typeof CAPABILITIES;

/** Edge-safe check against a raw role string (used by proxy.ts). */
export function roleHasCapability(
  role: string | null | undefined,
  capability: Capability,
): boolean {
  return !!role && (CAPABILITIES[capability] as readonly string[]).includes(role);
}
