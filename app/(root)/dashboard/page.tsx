import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

/**
 * Post-sign-in landing router: sends each role to its home screen.
 * SignInForm points here when no explicit callbackUrl was requested.
 */
export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { role?: string; isInstructor?: boolean }
    | undefined;

  if (!user) redirect("/");

  switch (user.role) {
    case "RECEPTION":
      redirect("/reception");
    case "ACCOUNTANT":
      redirect("/accounting/open-orders");
    case "INSTRUCTOR":
      redirect("/my-schedule");
    case "ADMIN":
    case "OWNER":
    case "STAFF":
      redirect("/bookings/dashboard");
    default:
      redirect(user.isInstructor ? "/my-schedule" : "/");
  }
}
