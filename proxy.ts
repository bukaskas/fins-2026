import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ADMIN_ROLES, STAFF_ROLES } from "@/lib/roles";

// Route prefix → required role tier. Order matters: the first matching prefix
// wins, so list more specific/stricter prefixes before broader ones.
const ADMIN_PREFIXES = ["/users"];
const STAFF_PREFIXES = [
  "/bookings",
  "/register",
  "/rentals",
  "/inventory",
  "/accounting",
  "/products",
  "/instructors",
  "/lessons",
  "/students",
];
const AUTH_PREFIXES = ["/my-schedule"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Determine the required tier for this path.
  let required: "admin" | "staff" | "auth" | null = null;
  if (matches(pathname, ADMIN_PREFIXES)) required = "admin";
  else if (matches(pathname, STAFF_PREFIXES)) required = "staff";
  else if (matches(pathname, AUTH_PREFIXES)) required = "auth";

  if (!required) return NextResponse.next();

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
    required === "auth"
      ? true
      : required === "staff"
        ? (STAFF_ROLES as readonly string[]).includes(role)
        : (ADMIN_ROLES as readonly string[]).includes(role);

  // Signed in but wrong role → bounce to home.
  if (!allowed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/users",
    "/users/:path*",
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
  ],
};
