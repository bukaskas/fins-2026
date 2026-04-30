import { getClosedDates } from "@/lib/actions/closedDate.actions";
import { ClosedDateForm } from "./ClosedDateForm";
import Link from "next/link";
import { addMonths } from "date-fns";
import type { ClosedDate } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function ClosedDatesPage() {
  const result = await getClosedDates(new Date(), addMonths(new Date(), 12));
  const closedDates = result.success ? (result.data as ClosedDate[]) : [];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-8">
          <Link
            href="/bookings/dashboard"
            className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] transition-colors duration-150 mb-6"
          >
            ← Dashboard
          </Link>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-1">
                Capacity Management
              </p>
              <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3.5rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none">
                Closed Dates
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[0.65rem] font-[family-name:var(--font-raleway)] text-[#8a8480] border border-[#ece8e3] px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              Auto-closes at 80 confirmed people / day
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <ClosedDateForm closedDates={closedDates} />
      </div>
    </div>
  );
}

export default ClosedDatesPage;
