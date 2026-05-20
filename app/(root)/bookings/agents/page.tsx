import Link from "next/link";
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  subDays,
} from "date-fns";

import { getAgentStats } from "@/lib/actions/booking.actions";
import { formatEGP } from "@/lib/commission";
import { AgentStatsRangePills } from "@/components/bookings/AgentStatsRangePills";
import { AgentStatsCharts } from "@/components/bookings/AgentStatsCharts";
import { AgentStatsTable } from "@/components/bookings/AgentStatsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Range = "today" | "week" | "month" | "last30" | "quarter" | "all";

function resolveRange(range: Range): {
  start: Date | null;
  end: Date | null;
  label: string;
} {
  const now = new Date();
  switch (range) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: format(now, "EEE d MMM"),
      };
    case "week": {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        start,
        end,
        label: `${format(start, "d MMM")} – ${format(end, "d MMM")}`,
      };
    }
    case "last30":
      return {
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
        label: "Last 30 days",
      };
    case "quarter": {
      const start = startOfQuarter(now);
      const end = endOfQuarter(now);
      return {
        start,
        end,
        label: `${format(start, "MMM")} – ${format(end, "MMM yyyy")}`,
      };
    }
    case "all":
      return { start: null, end: null, label: "All time" };
    case "month":
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: format(now, "MMMM yyyy"),
      };
  }
}

async function BookingsAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "month" } = await searchParams;
  const r = (["today", "week", "month", "last30", "quarter", "all"].includes(range)
    ? range
    : "month") as Range;

  const { start, end, label } = resolveRange(r);
  const result = await getAgentStats(start, end);

  if (!result.success) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-600">Error: {result.message}</p>
      </div>
    );
  }

  const { team, perAgent } = result.data;
  const activeCount = perAgent.filter(
    (a) => a.agentId !== null && a.touched > 0,
  ).length;

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
            <Link
              href="/bookings/dashboard"
              className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] border border-[#ece8e3] px-4 py-2.5 hover:border-[#d6d0c8] transition-colors duration-200"
            >
              Calendar Dashboard
            </Link>
          </div>

          <div className="flex items-baseline gap-4 mb-1">
            <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(3rem,8vw,6rem)] font-[100] tracking-[-0.03em] text-[#1a1614] leading-none">
              Team
            </h1>
            <span className="font-[family-name:var(--font-raleway)] text-[clamp(1rem,2.5vw,1.8rem)] font-[100] text-[#b0a89f] tracking-[-0.01em] mb-1 self-end">
              {label}
            </span>
          </div>
          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-6">
            Agent Performance
          </p>

          <AgentStatsRangePills rangeLabel={`${activeCount} active agent${activeCount === 1 ? "" : "s"}`} />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#ece8e3]">
          <Kpi
            label="Total bookings"
            value={team.totalBookings.toLocaleString("en-US")}
          />
          <Kpi
            label="Confirmed"
            value={team.confirmedCount.toLocaleString("en-US")}
            sub={`${team.declinedCount} declined · ${team.pendingCount} pending`}
            accent="#15803d"
          />
          <Kpi
            label="Conversion"
            value={`${Math.round(team.conversionRate * 100)}%`}
            sub="Confirmed / decided"
            accent="#1a1614"
          />
          <Kpi
            label="Revenue"
            value={formatEGP(team.revenueCents)}
            sub={`${formatEGP(team.collectedCents)} collected`}
            accent="#1a1614"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AgentStatsCharts perAgent={perAgent} serviceBreakdown={team.serviceBreakdown} />
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-7 shrink-0 bg-[#1a1614]" />
          <span className="text-[0.58rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[700] text-[#1a1614]">
            Per agent
          </span>
          {team.unassignedCount > 0 && (
            <span className="text-[0.6rem] tracking-[0.12em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480]">
              · {team.unassignedCount} unassigned
            </span>
          )}
        </div>
        <AgentStatsTable rows={perAgent} />
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

export default BookingsAgentsPage;
