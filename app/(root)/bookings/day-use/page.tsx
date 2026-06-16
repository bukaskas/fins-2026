import Link from "next/link";
import { format } from "date-fns";

import { getDayUseMonthlyReport } from "@/lib/actions/booking.actions";
import { listAgents } from "@/lib/actions/user.actions";
import { DayUseReportFilters } from "@/components/bookings/DayUseReportFilters";
import { DayUseReportChart } from "@/components/bookings/DayUseReportChart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseMonth(raw: string | undefined): { year: number; month: number; value: string } {
  const now = new Date();
  const match = raw?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month, value: raw! };
    }
  }
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return { year, month, value: `${year}-${String(month).padStart(2, "0")}` };
}

async function DayUseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; agentId?: string }>;
}) {
  const { month: monthParam, agentId: agentParam } = await searchParams;
  const { year, month, value: monthValue } = parseMonth(monthParam);
  const agentId = agentParam ?? "all";

  const [result, agents] = await Promise.all([
    getDayUseMonthlyReport({ year, month, agentId }),
    listAgents(),
  ]);

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  if (!result.success) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-600">Error: {result.message}</p>
      </div>
    );
  }

  const { totals, perDay } = result.data;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] transition-colors duration-150"
            >
              ← Bookings
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/bookings/payments"
                className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] border border-[#ece8e3] px-4 py-2.5 hover:border-[#d6d0c8] transition-colors duration-200"
              >
                Deposits
              </Link>
              <Link
                href="/day-use/booking"
                className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] border border-[#ece8e3] px-4 py-2.5 hover:border-[#d6d0c8] transition-colors duration-200"
              >
                Create New Booking
              </Link>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mb-1">
            <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(3rem,8vw,6rem)] font-[100] tracking-[-0.03em] text-[#1a1614] leading-none">
              Day Use
            </h1>
            <span className="font-[family-name:var(--font-raleway)] text-[clamp(1rem,2.5vw,1.8rem)] font-[100] text-[#b0a89f] tracking-[-0.01em] mb-1 self-end">
              {monthLabel}
            </span>
          </div>
          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-6">
            Monthly Report
          </p>

          <DayUseReportFilters agents={agents} month={monthValue} agentId={agentId} />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#ece8e3]">
          <Kpi
            label="Confirmed bookings"
            value={totals.confirmedBookings.toLocaleString("en-US")}
            sub={`${totals.declinedBookings} declined`}
            accent="#15803d"
          />
          <Kpi
            label="Confirmed people"
            value={totals.confirmedPeople.toLocaleString("en-US")}
            accent="#15803d"
          />
          <Kpi
            label="Applied bookings"
            value={totals.appliedBookings.toLocaleString("en-US")}
            sub="All statuses"
          />
          <Kpi
            label="Applied people"
            value={totals.appliedPeople.toLocaleString("en-US")}
            sub="All statuses"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-7 shrink-0 bg-[#1a1614]" />
          <span className="text-[0.58rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[700] text-[#1a1614]">
            Confirmed guests by day
          </span>
        </div>
        <DayUseReportChart perDay={perDay} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent = "#1a1614",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="py-8 px-6 border-r border-[#ece8e3] last:border-r-0">
      <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.3em] uppercase font-[600] text-[#8a8480] mb-3">
        {label}
      </p>
      <p
        className="font-[family-name:var(--font-raleway)] text-[clamp(1.8rem,4vw,3rem)] font-[100] leading-none tracking-[-0.02em]"
        style={{ color: accent }}
      >
        {value}
      </p>
      {sub && (
        <p className="font-[family-name:var(--font-raleway)] text-[0.66rem] tracking-[0.04em] text-[#8a8480] mt-3">
          {sub}
        </p>
      )}
    </div>
  );
}

export default DayUseReportPage;
