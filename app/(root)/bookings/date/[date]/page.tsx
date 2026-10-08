import { getBookingsByDate, type BookingWithAgent } from "@/lib/actions/booking.actions";
import { listAgents } from "@/lib/actions/user.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { AgentsProvider } from "@/components/bookings/AgentsProvider";
import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { isDateKey } from "@/lib/date-keys";
import { actionRank, CLOSING_STATUSES, FOCUS_RING, SERVICE_META } from "@/lib/bookings/status";
import { getClosedDates } from "@/lib/actions/closedDate.actions";
import { capacityPeople, capacityState } from "@/lib/bookings/capacity";
import { SearchInput } from "./SearchInput";
import { CapacityBar } from "./CapacityBar";
import { AgentFilter } from "./AgentFilter";
import { GroupFilter } from "./GroupFilter";
import { GROUP_OPTIONS } from "./group-options";
import { DateHeaderActions } from "./DateHeaderActions";
import { FilterTransitionProvider, PendingRegion, TransitionLink } from "./FilterTransition";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Everything still in play. Closed bookings only show on their own tab.
const LIVE_STATUSES = Object.values(BookingStatus).filter(
  (s) => !CLOSING_STATUSES.includes(s),
);

// Fixed service order so sections don't jump as bookings come and go.
const SERVICE_ORDER = Object.keys(SERVICE_META);
const serviceRank = (service: string) => {
  const i = SERVICE_ORDER.indexOf(service);
  return i === -1 ? SERVICE_ORDER.length : i;
};

const STATUS_FILTERS: {
  label: string;
  value: string;
  statuses: BookingStatus[];
  /** Opt-in: set apart from the working tabs. */
  archive?: boolean;
}[] = [
  // `value: "all"` keeps old links and the bare URL landing here.
  { label: "Live",              value: "all",       statuses: LIVE_STATUSES },
  { label: "Confirmed",         value: "confirmed", statuses: [BookingStatus.CONFIRMED, BookingStatus.ARRIVED] },
  { label: "Waiting Payment",   value: "waiting",   statuses: [BookingStatus.WAITING_PAYMENT] },
  {
    label: "Pending",
    value: "pending",
    statuses: [
      BookingStatus.PENDING,
      BookingStatus.REQUEST_SENT,
      BookingStatus.UNDER_REVIEW,
    ],
  },
  {
    label: "Declined / Canceled",
    value: "declined",
    statuses: CLOSING_STATUSES,
    archive: true,
  },
];

const DAY_LINK = `inline-flex min-h-11 items-center gap-1 font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.14em] uppercase font-[600] tabular-nums text-[#6b6460] hover:text-[#1a1614] transition-colors duration-150 ${FOCUS_RING}`;

/** Local midnight of a `YYYY-MM-DD` key, for display formatting only. */
function displayDate(key: string) {
  return new Date(`${key}T00:00:00`);
}

/** The `YYYY-MM-DD` key `days` away, computed in UTC so DST never skips a day. */
function shiftDateKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

async function BookingsByDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ status?: string; q?: string; agent?: string; group?: string }>;
}) {
  const [{ date }, { status = "all", q = "", agent = "all", group: groupParam = "all" }] = await Promise.all([
    params,
    searchParams,
  ]);

  // A malformed date would otherwise throw inside date-fns and 500 the page.
  if (!isDateKey(date)) notFound();

  const group = GROUP_OPTIONS.some((o) => o.value === groupParam) ? groupParam : "all";

  const activeFilter =
    STATUS_FILTERS.find((f) => f.value === status) ?? STATUS_FILTERS[0];

  // One fetch for the day; the status tab filters it in memory, so the list
  // and the header counts can never come from different reads.
  const dayStartUTC = new Date(`${date}T00:00:00.000Z`);
  const [allResult, allUsers, closedResult] = await Promise.all([
    getBookingsByDate(date),
    listAgents(),
    getClosedDates(dayStartUTC, dayStartUTC),
  ]);

  const dayLabel   = format(displayDate(date), "EEEE");
  const dateLabel  = format(displayDate(date), "MMMM d");
  const yearLabel  = format(displayDate(date), "yyyy");
  const baseHref   = `/bookings/date/${date}`;

  // Day links keep the status and agent filters; a guest search is per-day.
  const dayHref = (key: string) => {
    const params = new URLSearchParams();
    if (activeFilter.value !== "all") params.set("status", activeFilter.value);
    if (agent !== "all") params.set("agent", agent);
    if (group !== "all") params.set("group", group);
    const qs = params.toString();
    return qs ? `/bookings/date/${key}?${qs}` : `/bookings/date/${key}`;
  };
  const prevDate = shiftDateKey(date, -1);
  const nextDate = shiftDateKey(date, 1);

  if (!allResult.success) {
    const reloadParams = new URLSearchParams();
    if (activeFilter.value !== "all") reloadParams.set("status", activeFilter.value);
    if (q) reloadParams.set("q", q);
    if (agent !== "all") reloadParams.set("agent", agent);
    if (group !== "all") reloadParams.set("group", group);
    const reloadHref = reloadParams.size ? `${baseHref}?${reloadParams}` : baseHref;

    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-16">
          <Link
            href="/bookings/dashboard"
            className={`inline-flex min-h-11 items-center gap-1.5 text-[0.72rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#6b6460] hover:text-[#1a1614] transition-colors duration-150 ${FOCUS_RING}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-4 font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3.5rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none">
            {dateLabel}
          </h1>
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 border border-alert-line bg-alert-bg px-5 py-4"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-alert-icon" aria-hidden="true" />
            <div className="min-w-0 font-[family-name:var(--font-raleway)]">
              <p className="text-[0.875rem] font-[700] text-alert-ink">
                Bookings for {dateLabel} didn’t load
              </p>
              <p className="mt-1 text-[0.875rem] font-[400] leading-[1.5] text-alert-ink">
                Nothing for this day is shown, so don’t tell a guest the day is free or full
                until it loads.{" "}
                <Link
                  href={reloadHref}
                  className={`font-[700] underline underline-offset-2 hover:text-[#1a1614] ${FOCUS_RING}`}
                >
                  Try again
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allBookings = allResult.data as BookingWithAgent[];

  const query = q.trim().toLowerCase();
  const rawBookings = allBookings.filter((b) =>
    activeFilter.statuses.includes(b.bookingStatus),
  );

  const matchesAgent = (b: BookingWithAgent) => {
    if (agent === "all") return true;
    if (agent === "unassigned") return b.agentId == null;
    return b.agentId === agent;
  };

  const matchesGroup = (b: BookingWithAgent) => group === "all" || b.bookingGroup === group;

  const bookings = rawBookings.filter((b) => {
    if (!matchesAgent(b) || !matchesGroup(b)) return false;
    if (!query) return true;
    return (
      b.name?.toLowerCase().includes(query) ||
      b.email?.toLowerCase().includes(query) ||
      b.phone?.toLowerCase().includes(query)
    );
  });

  const pendingCount = allBookings.filter(
    (b) => b.bookingStatus === BookingStatus.PENDING,
  ).length;

  const confirmedBookings = allBookings.filter(
    (b) => b.bookingStatus === BookingStatus.CONFIRMED || b.bookingStatus === BookingStatus.ARRIVED,
  );
  const confirmedAdults  = confirmedBookings.reduce((s, b) => s + b.numberOfPeople, 0);
  const confirmedKids    = confirmedBookings.reduce((s, b) => s + (b.numberOfKids ?? 0), 0);
  const confirmedDepositEGP = confirmedBookings.reduce((s, b) => s + b.amountPaidCents, 0) / 100;
  const summaryText = [
    `Confirmed bookings – ${format(displayDate(date), "d MMMM yyyy")}`,
    `Adults: ${confirmedAdults}`,
    `Kids: ${confirmedKids}`,
    `Total deposit paid: ${confirmedDepositEGP.toLocaleString("en-EG")} EGP`,
  ].join("\n");

  // Unknown when the closed-dates read fails: the bar then makes no
  // open/closed claim rather than guessing "Available".
  const isClosed = closedResult.success ? closedResult.data.length > 0 : null;
  const capacity = capacityState(capacityPeople(allBookings), isClosed === true);

  // Rows that need staff first; the stable sort keeps time order within a rank.
  const sorted = [...bookings].sort(
    (a, b) => actionRank(a.bookingStatus) - actionRank(b.bookingStatus),
  );

  // Group by service
  const grouped = sorted.reduce(
    (acc, booking) => {
      const service = booking.service || "Unknown";
      if (!acc[service]) acc[service] = [];
      acc[service].push(booking);
      return acc;
    },
    {} as Record<string, BookingWithAgent[]>,
  );

  // People count per status filter tab, derived from all bookings (respects agent filter)
  const agentScopedAll = allBookings.filter((b) => matchesAgent(b) && matchesGroup(b));
  const statusPeople = STATUS_FILTERS.map((f) => {
    const matched = agentScopedAll.filter((b) => f.statuses.includes(b.bookingStatus));
    return { value: f.value, people: matched.reduce((s, b) => s + b.numberOfPeople, 0) };
  });

  const archive = STATUS_FILTERS.find((f) => f.archive)!;
  const closedPeople = statusPeople.find((p) => p.value === archive.value)?.people ?? 0;
  const archiveParams = new URLSearchParams({ status: archive.value });
  if (q) archiveParams.set("q", q);
  if (agent !== "all") archiveParams.set("agent", agent);
  if (group !== "all") archiveParams.set("group", group);
  const archiveHref = `${baseHref}?${archiveParams}`;

  const headerActions = {
    date,
    dateLabel: `${dateLabel}, ${yearLabel}`,
    pendingCount,
    summaryText,
  };

  return (
    <AgentsProvider agents={allUsers}>
    <FilterTransitionProvider>
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-6">

          {/* Back link — on phones the actions menu shares this row */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <Link
              href="/bookings/dashboard"
              className={`inline-flex min-h-11 items-center gap-1.5 text-[0.72rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#6b6460] hover:text-[#1a1614] transition-colors duration-150 ${FOCUS_RING}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Dashboard
            </Link>
            <DateHeaderActions mode="menu" {...headerActions} />
          </div>

          {/* Date + stats */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.32em] uppercase font-[600] text-[#6b6460] mb-1">
                {dayLabel} · {yearLabel}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3.5rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none">
                  {dateLabel}
                </h1>
                <nav aria-label="Change day" className="flex items-center">
                  <TransitionLink
                    href={dayHref(prevDate)}
                    aria-label={`Previous day, ${format(displayDate(prevDate), "EEEE d MMMM")}`}
                    className={`${DAY_LINK} pr-2`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {format(displayDate(prevDate), "MMM d")}
                  </TransitionLink>
                  <span aria-hidden="true" className="text-[#d6d0c8]">·</span>
                  <TransitionLink
                    href={dayHref(nextDate)}
                    aria-label={`Next day, ${format(displayDate(nextDate), "EEEE d MMMM")}`}
                    className={`${DAY_LINK} pl-2`}
                  >
                    {format(displayDate(nextDate), "MMM d")}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </TransitionLink>
                </nav>
              </div>

              <CapacityBar
                {...capacity}
                closedKnown={isClosed !== null}
                className="mt-4"
              />
            </div>

            <DateHeaderActions mode="inline" {...headerActions} />
          </div>

          {/* ── Filter tabs ── */}
          <div className="-mx-6 flex gap-0 mt-6 sm:mt-8 px-6 sm:mx-0 sm:px-0 border-b border-[#ece8e3] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_FILTERS.map((f) => {
              const params = new URLSearchParams();
              if (f.value !== "all") params.set("status", f.value);
              if (q) params.set("q", q);
              if (agent !== "all") params.set("agent", agent);
              if (group !== "all") params.set("group", group);
              const qs = params.toString();
              const href = qs ? `${baseHref}?${qs}` : baseHref;
              const isActive = activeFilter.value === f.value;
              const people = statusPeople.find((s) => s.value === f.value)?.people ?? 0;
              const tab = (
                <TransitionLink
                  key={f.value}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative inline-flex min-h-11 shrink-0 items-center mr-6 last:mr-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] transition-colors duration-150"
                  style={{ color: isActive ? "#1a1614" : "#6b6460" }}
                >
                  <span>{f.label}</span>
                  <span
                    className="ml-1.5 text-[0.72rem] font-[500] tabular-nums"
                    style={{ color: isActive ? "#3d3633" : "#6b6460" }}
                  >
                    {people}p
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a1614]" />
                  )}
                </TransitionLink>
              );
              if (!f.archive) return tab;
              // Closed bookings are opt-in: pushed right, past a rule.
              return (
                <div key={f.value} className="ml-auto flex shrink-0 items-center">
                  <span aria-hidden="true" className="mr-6 h-4 w-px bg-[#d6d0c8]" />
                  {tab}
                </div>
              );
            })}
          </div>

          {/* ── Search + Agent filter ── */}
          <div className="md:flex md:items-end md:gap-3">
            <div className="flex-1">
              {/* Keyed by day so the box clears when the date changes. */}
              <SearchInput key={date} defaultValue={q} />
            </div>
            <AgentFilter
              agents={allUsers.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
              value={agent}
            />
            <GroupFilter value={group} />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PendingRegion>
        {bookings.length === 0 ? (
          <div className="py-16 text-center font-[family-name:var(--font-raleway)]">
            <p className="text-[0.75rem] tracking-[0.2em] uppercase text-[#6b6460]">
              No {activeFilter.label.toLowerCase()} bookings
              {query ? ` matching "${q}"` : " for this date"}
            </p>
            {activeFilter.value === "all" && closedPeople > 0 && (
              <TransitionLink
                href={archiveHref}
                className={`mt-3 inline-flex min-h-11 items-center gap-1 text-[0.8rem] font-[600] text-[#1a1614] underline underline-offset-4 decoration-[#d6d0c8] hover:decoration-[#1a1614] ${FOCUS_RING}`}
              >
                Show {closedPeople} {closedPeople === 1 ? "guest" : "guests"} in {archive.label.toLowerCase()}
              </TransitionLink>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped)
              .sort(([a], [b]) => serviceRank(a) - serviceRank(b) || a.localeCompare(b))
              .map(([service, serviceBookings]) => {
              const meta = SERVICE_META[service];
              const accent = { dot: meta?.dot ?? "#b0a89f", text: meta?.text ?? "#6b6460" };
              const serviceLabel = meta?.label ?? service.replace(/-/g, " ");

              if (service === "kitesurfing-course") {
                const byInstructor = serviceBookings.reduce(
                  (acc, b) => {
                    const instructor = b.instructor || "Unassigned";
                    if (!acc[instructor]) acc[instructor] = [];
                    acc[instructor].push(b);
                    return acc;
                  },
                  {} as Record<string, BookingWithAgent[]>,
                );

                return (
                  <section key={service}>
                    <ServiceHeader
                      label={serviceLabel}
                      count={serviceBookings.length}
                      accent={accent}
                    />
                    <div className="space-y-6">
                      {Object.entries(byInstructor).map(([instructor, list]) => (
                        <div key={instructor}>
                          <p className="font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.28em] uppercase font-[500] text-[#6b6460] mb-2 pl-1">
                            {instructor}
                          </p>
                          <div className="space-y-2">
                            {list.map((b) => (
                              <BookingComponent key={b.id} booking={b} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              return (
                <section key={service}>
                  <ServiceHeader
                    label={serviceLabel}
                    count={serviceBookings.length}
                    accent={accent}
                  />
                  <div className="space-y-2">
                    {serviceBookings.map((b) => (
                      <BookingComponent key={b.id} booking={b} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        </PendingRegion>
      </div>
    </div>
    </FilterTransitionProvider>
    </AgentsProvider>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function ServiceHeader({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent: { dot: string; text: string };
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span aria-hidden="true" className="h-px w-7 shrink-0" style={{ background: accent.dot }} />
      <h2
        className="text-[0.72rem] tracking-[0.32em] uppercase font-[family-name:var(--font-raleway)] font-[600]"
        style={{ color: accent.text }}
      >
        {label}
      </h2>
      <span className="text-[0.72rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#6b6460]">
        {count} {count === 1 ? "booking" : "bookings"}
      </span>
    </div>
  );
}

export default BookingsByDatePage;
