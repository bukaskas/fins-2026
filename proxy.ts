import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { roleHasCapability } from "@/lib/permissions";
import { PUBLIC_BOOKING_DETAIL, ruleForPath } from "@/lib/routes";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public, unauthenticated booking detail page.
  if (PUBLIC_BOOKING_DETAIL.test(pathname)) return NextResponse.next();

  const rule = ruleForPath(pathname);
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

// Next.js only statically analyses a literal matcher — a computed array is
// silently ignored, which would run the proxy on nothing. Keep this list in
// step with ROUTE_RULES in lib/routes.ts by hand.
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
