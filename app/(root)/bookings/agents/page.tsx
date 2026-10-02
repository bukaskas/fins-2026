import Link from "next/link";

import { getAgentStats } from "@/lib/actions/booking.actions";
import { ACTIVE_PENDING_STATUSES, type AgentStatsTeam } from "@/lib/bookings/agent-stats";
import { formatEGP } from "@/lib/commission";
import {
  addDaysToKey,
  addMonthsToKey,
  BUSINESS_TIME_ZONE,
  cairoDayStart,
  dateKeyInCairo,
  utcMidnightFromKey,
  type DateKey,
} from "@/lib/date-keys";
import { AgentStatsRangePills } from "@/components/bookings/AgentStatsRangePills";
import { AgentStatsCharts } from "@/components/bookings/AgentStatsCharts";
import { AgentStatsTable } from "@/components/bookings/AgentStatsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RANGES = ["today", "week", "month", "last30", "quarter", "all"] as const;
type Range = (typeof RANGES)[number];

function formatKey(key: DateKey, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
    utcMidnightFromKey(key),
  );
}

/**
 * A range as Cairo calendar days: `[startKey, endKey)`, plus the start of the
 * equally long period before it. Bookings are matched on `createdAt`, an
 * instant, so the keys are turned into Cairo midnights by the caller.
 */
function resolveRange(range: Range): {
  startKey: DateKey;
  endKey: DateKey;
  previousKey: DateKey;
  label: string;
} | null {
  const today = dateKeyInCairo();
  switch (range) {
    case "today":
      return {
        startKey: today,
        endKey: addDaysToKey(today, 1),
        previousKey: addDaysToKey(today, -1),
        label: formatKey(today, { weekday: "short", day: "numeric", month: "short" }),
      };
    case "week": {
      // Monday-based week.
      const sinceMonday = (utcMidnightFromKey(today).getUTCDay() + 6) % 7;
      const startKey = addDaysToKey(today, -sinceMonday);
      return {
        startKey,
        endKey: addDaysToKey(startKey, 7),
        previousKey: addDaysToKey(startKey, -7),
        label: `${formatKey(startKey, { day: "numeric", month: "short" })} – ${formatKey(
          addDaysToKey(startKey, 6),
          { day: "numeric", month: "short" },
        )}`,
      };
    }
    case "last30": {
      const startKey = addDaysToKey(today, -29);
      return {
        startKey,
        endKey: addDaysToKey(today, 1),
        previousKey: addDaysToKey(startKey, -30),
        label: "Last 30 days",
      };
    }
    case "quarter": {
      const [year, month] = today.split("-").map(Number);
      const firstMonth = Math.floor((month - 1) / 3) * 3 + 1;
      const startKey = `${year}-${String(firstMonth).padStart(2, "0")}-01`;
      return {
        startKey,
        endKey: addMonthsToKey(startKey, 3),
        previousKey: addMonthsToKey(startKey, -3),
        label: `${formatKey(startKey, { month: "short" })} – ${formatKey(
          addMonthsToKey(startKey, 2),
          { month: "short", year: "numeric" },
        )}`,
      };
    }
    case "all":
      return null;
    case "month": {
      const startKey = `${today.slice(0, 7)}-01`;
      return {
        startKey,
        endKey: addMonthsToKey(startKey, 1),
        previousKey: addMonthsToKey(startKey, -1),
        label: formatKey(startKey, { month: "long", year: "numeric" }),
      };
    }
  }
}

/** "+12% vs previous period", or nothing when there is no baseline. */
function changeVsPrevious(current: number, previous: number | undefined): string | undefined {
  if (!previous) return undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? "+" : ""}${pct}% vs previous period`;
}

function conversionChange(team: AgentStatsTeam, previous: AgentStatsTeam | null) {
  if (team.conversionRate === null || !previous || previous.conversionRate === null) {
    return undefined;
  }
  const points = Math.round((team.conversionRate - previous.conversionRate) * 100);
  return `${points > 0 ? "+" : ""}${points} pts vs previous period`;
}

async function BookingsAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "month" } = await searchParams;
  const r: Range = (RANGES as readonly string[]).includes(range) ? (range as Range) : "month";

  const resolved = resolveRange(r);
  const result = await getAgentStats(
    resolved ? cairoDayStart(resolved.startKey) : null,
    resolved ? cairoDayStart(resolved.endKey) : null,
    resolved ? cairoDayStart(resolved.previousKey) : null,
  );
  const label = resolved?.label ?? "All time";

  if (!result.success) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-600">Error: {result.message}</p>
      </div>
    );
  }

  const { team, previous, perAgent, scope, trackingSince } = result.data;
  const activeCount = perAgent.filter(
    (a) => a.agentId !== null && a.confirmedCount + a.openCount + a.lostCount + a.declinedCount > 0,
  ).length;
  const untouchedHref = `/bookings?agent=unassigned&status=${ACTIVE_PENDING_STATUSES.join(",")}&range=all`;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#6b6460] hover:text-[#1a1614] transition-colors duration-150"
            >
              ← Bookings
            </Link>
            <Link
              href="/bookings/dashboard"
              className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#6b6460] hover:text-[#1a1614] border border-[#ece8e3] px-4 py-2.5 hover:border-[#d6d0c8] transition-colors duration-200"
            >
              Calendar Dashboard
            </Link>
          </div>

          <div className="flex items-baseline gap-4 mb-1">
            <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(3rem,8vw,6rem)] font-[100] tracking-[-0.03em] text-[#1a1614] leading-none">
              Team
            </h1>
            <span className="font-[family-name:var(--font-raleway)] text-[clamp(1rem,2.5vw,1.8rem)] font-[100] text-[#6b6460] tracking-[-0.01em] mb-1 self-end">
              {label}
            </span>
          </div>
          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#6b6460] mb-6">
            Agent Performance · bookings created in this period
          </p>

          <AgentStatsRangePills
            rangeLabel={
              scope === "team"
                ? `${activeCount} active agent${activeCount === 1 ? "" : "s"}`
                : "Team totals and your own numbers"
            }
          />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#ece8e3]">
          <Kpi
            label="Bookings"
            value={team.totalBookings.toLocaleString("en-US")}
            note={changeVsPrevious(team.totalBookings, previous?.totalBookings)}
          />
          <Kpi
            label="Confirmed"
            value={team.confirmedCount.toLocaleString("en-US")}
            sub={`${team.lostCount} lost · ${team.declinedCount} declined · ${team.cancelledAfterConfirmCount} cancelled later`}
            note={changeVsPrevious(team.confirmedCount, previous?.confirmedCount)}
            accent="#15803d"
          />
          <Kpi
            label="Conversion"
            value={
              team.conversionRate === null ? "n/a" : `${Math.round(team.conversionRate * 100)}%`
            }
            sub="Won / (won + lost); declines excluded"
            note={conversionChange(team, previous)}
          />
          <Kpi
            label="Booked value"
            value={formatEGP(team.revenueCents)}
            sub={`${formatEGP(team.outstandingCents)} outstanding${
              team.unpricedCount > 0 ? ` · ${team.unpricedCount} unpriced` : ""
            }`}
            note={changeVsPrevious(team.revenueCents, previous?.revenueCents)}
          />
          <Kpi
            label="Open leads"
            value={`${team.openUntouched} untouched`}
            sub={`${team.openInProgress} in progress`}
            href={team.openUntouched > 0 ? untouchedHref : undefined}
            hrefLabel="Open bookings with no owner"
            accent={team.openUntouched > 0 ? "#b45309" : "#1a1614"}
            wide
          />
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AgentStatsCharts
          perAgent={perAgent}
          serviceBreakdown={team.serviceBreakdown}
          hasBookings={team.totalBookings > 0}
        />
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
          <span className="h-px w-7 shrink-0 bg-[#1a1614]" />
          <span className="text-[0.58rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[700] text-[#1a1614]">
            {scope === "team" ? "Per agent" : "Your numbers"}
          </span>
          <span className="text-[0.66rem] font-[family-name:var(--font-raleway)] text-[#6b6460]">
            {trackingSince
              ? `Response times are recorded from ${new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: BUSINESS_TIME_ZONE,
                }).format(trackingSince)}.`
              : "Response times start once the first booking change is recorded."}
          </span>
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
  note,
  href,
  hrefLabel,
  accent = "#1a1614",
  wide = false,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Change against the previous period. */
  note?: string;
  href?: string;
  hrefLabel?: string;
  accent?: string;
  /** Spans the row on phones, where five tiles leave one on its own. */
  wide?: boolean;
}) {
  return (
    <div
      className={`py-8 px-6 border-r border-[#ece8e3] last:border-r-0 ${
        wide ? "col-span-2 md:col-span-1" : ""
      }`}
    >
      <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.3em] uppercase font-[600] text-[#6b6460] mb-3">
        {label}
      </p>
      <p
        className="font-[family-name:var(--font-raleway)] text-[clamp(1.5rem,3vw,2.4rem)] font-[100] leading-none tracking-[-0.02em]"
        style={{ color: accent }}
      >
        {value}
      </p>
      {sub && (
        <p className="font-[family-name:var(--font-raleway)] text-[0.66rem] tracking-[0.04em] text-[#6b6460] mt-3">
          {sub}
        </p>
      )}
      {note && (
        <p className="font-[family-name:var(--font-raleway)] text-[0.66rem] tracking-[0.04em] text-[#6b6460] mt-1">
          {note}
        </p>
      )}
      {href && (
        <Link
          href={href}
          className="inline-block font-[family-name:var(--font-raleway)] text-[0.66rem] tracking-[0.04em] text-[#1a1614] underline underline-offset-2 mt-2"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

export default BookingsAgentsPage;
