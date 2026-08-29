import type { Capability } from "@/lib/permissions";

/**
 * Which routes are staff surfaces, and what each one requires.
 *
 * Edge-safe (plain strings, no Prisma) so `proxy.ts` can enforce it and the
 * layout can read it. Keeping one list means the chrome a page renders and the
 * capability it demands can never drift apart.
 */

// Route prefix → required capability (see lib/permissions.ts for the
// role→capability map). Order matters: the first matching prefix wins, so
// list more specific prefixes before broader ones. "auth" means any
// signed-in user.
export const ROUTE_RULES: Array<{
  prefixes: string[];
  required: Capability | "auth";
}> = [
  { prefixes: ["/users"], required: "users:admin" },
  { prefixes: ["/reception", "/bookings"], required: "bookings:manage" },
  { prefixes: ["/register", "/students"], required: "desk:checkin" },
  // Desk collection pages before the broader /accounting rule (D2).
  {
    prefixes: ["/accounting/new-payment", "/accounting/open-orders"],
    required: "desk:collect",
  },
  { prefixes: ["/accounting"], required: "accounting:manage" },
  { prefixes: ["/rentals"], required: "rentals:manage" },
  { prefixes: ["/inventory"], required: "inventory:manage" },
  { prefixes: ["/products"], required: "products:manage" },
  { prefixes: ["/instructors"], required: "instructors:manage" },
  // Lesson creation before the broader read-level /lessons rule.
  { prefixes: ["/lessons/new"], required: "lessons:manage" },
  { prefixes: ["/lessons"], required: "lessons:view" },
  { prefixes: ["/my-schedule", "/dashboard"], required: "auth" },
];

/**
 * Public booking detail page: /bookings/<uuid> (no trailing path). Lets a guest
 * check their own booking status from a shared link without signing in. The
 * staff desk view /bookings/<uuid>/desk and the edit route both have a trailing
 * segment and stay staff-only.
 */
export const PUBLIC_BOOKING_DETAIL =
  /^\/bookings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

export function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function ruleForPath(pathname: string) {
  if (PUBLIC_BOOKING_DETAIL.test(pathname)) return undefined;
  return ROUTE_RULES.find((r) => matchesPrefix(pathname, r.prefixes));
}

/**
 * True for back-office surfaces — the pages someone is working in rather than
 * browsing. They keep the header (it carries the back-office navigation) but
 * drop the marketing footer and the guest WhatsApp widget.
 *
 * The guest's own booking page is deliberately NOT a staff path: it is a public
 * link sent over WhatsApp, so it keeps the full site chrome.
 */
export function isStaffPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ruleForPath(pathname) !== undefined;
}
