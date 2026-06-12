import { getServerSession } from "next-auth/next";

import { prisma } from "@/db/prisma";
import { authOptions } from "@/lib/auth";
import { ResendVerificationButton } from "./ResendVerificationButton";

/**
 * Non-blocking nag shown to signed-in users whose email isn't verified yet.
 * The verification state lives in the DB (not the 30-day JWT), so we read it
 * fresh here — the parent layout is already `force-dynamic`.
 */
export async function EmailVerificationBanner() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user || user.emailVerified) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span>Please verify your email address to secure your account.</span>
        <ResendVerificationButton />
      </div>
    </div>
  );
}
