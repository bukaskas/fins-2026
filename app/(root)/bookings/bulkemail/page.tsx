import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { BulkEmailForm } from "./BulkEmailForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

export default async function BulkEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session) {
    redirect("/signin?callbackUrl=/bookings/bulkemail");
  }
  if (!role || !STAFF_ROLES.includes(role)) {
    redirect("/");
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = date ?? today;

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* soft beach ambience: layered pastel gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, #E4F1FA 0%, transparent 60%), radial-gradient(50rem 38rem at -10% 110%, #FFE4D6 0%, transparent 55%), radial-gradient(40rem 30rem at 50% 50%, #FAF4E8 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-20 sm:px-6 sm:pt-10">
        {/* top utility bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <Link
            href={`/bookings/date/${defaultDate}`}
            className="group inline-flex items-center gap-2 text-[#5b5650] hover:text-[#1a1614] transition-colors"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[#ece8e3] bg-white/70 backdrop-blur-sm transition-colors group-hover:border-[#d6d0c8]">
              <ArrowLeft className="size-3.5" strokeWidth={1.5} />
            </span>
            <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.22em] uppercase font-[600]">
              Bookings
            </span>
          </Link>
        </div>

        <header className="mb-8">
          <span className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
            Staff tools
          </span>
          <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3.5rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none mt-1">
            Bulk email
          </h1>
          <p className="mt-3 font-[family-name:var(--font-raleway)] text-[0.9rem] text-[#5b5650] leading-[1.6]">
            Pick a date, choose booking statuses, and email all matching guests.
            This never changes any booking status.
          </p>
        </header>

        <BulkEmailForm defaultDate={defaultDate} />
      </div>
    </div>
  );
}
