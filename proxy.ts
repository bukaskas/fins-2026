import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { roleHasCapability, type Capability } from "@/lib/permissions";

// Route prefix → required capability (see lib/permissions.ts for the
// role→capability map). Order matters: the first matching prefix wins, so
// list more specific prefixes before broader ones. "auth" means any
// signed-in user.
const ROUTE_RULES: Array<{ prefixes: string[]; required: Capability | "auth" }> = [
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

// Public booking detail page: /bookings/<uuid> (no trailing path). Lets a guest
// check their own booking status from a shared link without signing in. The edit
// route /bookings/<uuid>/edit has a trailing segment and stays staff-only.
const PUBLIC_BOOKING_DETAIL =
  /^\/bookings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public, unauthenticated booking detail page.
  if (PUBLIC_BOOKING_DETAIL.test(pathname)) return NextResponse.next();

  const rule = ROUTE_RULES.find((r) => matches(pathname, r.prefixes));
  if (!rule) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not signed in → send to sign-in with a return path.
  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = (token.role as string | undefined) ?? "";

  const allowed =
    rule.required === "auth" ? true : roleHasCapability(role, rule.required);

  // Signed in but insufficient capability → bounce to home.
  if (!allowed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/users",
    "/users/:path*",
    "/reception",
    "/reception/:path*",
    "/bookings",
    "/bookings/:path*",
    "/register",
    "/register/:path*",
    "/rentals",
    "/rentals/:path*",
    "/inventory",
    "/inventory/:path*",
    "/accounting",
    "/accounting/:path*",
    "/products",
    "/products/:path*",
    "/instructors",
    "/instructors/:path*",
    "/lessons",
    "/lessons/:path*",
    "/students",
    "/students/:path*",
    "/my-schedule",
    "/my-schedule/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
