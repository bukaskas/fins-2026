import {
  getBookingsPage,
  type BookingRow,
  type BookingsQuery,
} from "@/lib/actions/booking.actions";
import { listAgents } from "@/lib/actions/user.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { AgentsProvider } from "@/components/bookings/AgentsProvider";
import { BookingsFilters } from "@/components/bookings/BookingsFilters";
import { BookingsHeaderActions } from "@/components/bookings/BookingsHeaderActions";
import { Button } from "@/components/ui/button";
import { BOOKINGS_PAGE_SIZE } from "@/lib/constants";
import { BookingStatus, Role } from "@prisma/client";
import { addDays, format } from "date-fns";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

const NAV_LINKS: { label: string; href: string; variant: "secondary" | "outline" }[] = [
  { label: "Dashboard",   href: "/bookings/dashboard",   variant: "secondary" },
  { label: "Agents",      href: "/bookings/agents",      variant: "outline" },
  { label: "Kitesurfing", href: "/bookings/kitesurfing", variant: "outline" },
  { label: "Lessons",     href: "/lessons",              variant: "outline" },
  { label: "Day Use",     href: "/bookings/day-use",     variant: "outline" },
  { label: "Restaurant",  href: "/bookings/restaurant",  variant: "outline" },
  { label: "Schedule",    href: "/bookings/schedule",    variant: "outline" },
  { label: "Deposits",    href: "/bookings/payments",    variant: "outline" },
];

// Booking dates are stored as UTC midnights and rendered from their UTC parts,
// so day keys are derived in UTC too — otherwise a server west of Greenwich
// would file a booking under the previous day.
function dateKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

function dateLabel(key: string, todayStr: string, tomorrowStr: string) {
  // Midday keeps the label on the intended day in any server timezone.
  const day = new Date(`${key}T12:00:00`);
  if (key === todayStr)    return `Today · ${format(day, "EEE d MMM")}`;
  if (key === tomorrowStr) return `Tomorrow · ${format(day, "EEE d MMM")}`;
  return format(day, "EEE d MMM");
}

type SearchParams = {
  status?: string;
  q?: string;
  service?: string;
  agent?: string;
  range?: string;
  group?: string;
  sort?: string;
  dir?: string;
  unpaid?: string;
  limit?: string;
};

/** The value each param has when it is absent from the URL. */
const PARAM_DEFAULTS: Record<string, string> = {
  status: "all",
  service: "all",
  agent: "all",
  range: "upcoming",
  group: "date",
  sort: "date",
  dir: "desc",
  unpaid: "",
};

function currentValue(sp: SearchParams, key: string) {
  return sp[key as keyof SearchParams] ?? PARAM_DEFAULTS[key] ?? "";
}

/** Current params with `updates` applied; default and empty values drop out. */
function buildHref(current: SearchParams, updates: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries({ ...current, ...updates })) {
    if (val && val !== PARAM_DEFAULTS[key]) params.set(key, val);
  }
  const qs = params.toString();
  return qs ? `/bookings?${qs}` : "/bookings";
}

async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const {
    status = "all",
    q = "",
    service = "all",
    agent = "all",
    range = "upcoming",
    group = "date",
    sort = "date",
    dir = "desc",
    unpaid = "",
  } = sp;

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session) {
    redirect("/signin?callbackUrl=/bookings");
  }
  if (!role || !STAFF_ROLES.includes(role)) {
    redirect("/");
  }

  const parsedLimit = Number.parseInt(sp.limit ?? "", 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : BOOKINGS_PAGE_SIZE;

  // Everything below is filtered, sorted and counted by Postgres — this page
  // only groups the rows it was handed.
  const query: BookingsQuery = { status, q, service, agent, range, sort, dir, unpaid, limit };

  const [page, allUsers] = await Promise.all([getBookingsPage(query), listAgents()]);
  const { rows: bookings, total, hasMore, stats } = page;

  const todayStr    = dateKey(new Date());
  const tomorrowStr = dateKey(addDays(new Date(), 1));

  // ── Group ───────────────────────────────────────────────────────────────
  type DateGroup    = Record<string, BookingRow[]>;
  type ServiceGroup = Record<string, Record<string, BookingRow[]>>;

  let byDate: DateGroup = {};
  let byService: ServiceGroup = {};

  if (group === "service") {
    byService = bookings.reduce((acc, b) => {
      const svc  = b.service    || "Unknown";
      const inst = b.instructor || "Unassigned";
      if (!acc[svc])       acc[svc] = {};
      if (!acc[svc][inst]) acc[svc][inst] = [];
      acc[svc][inst].push(b);
      return acc;
    }, {} as ServiceGroup);
  } else {
    byDate = bookings.reduce((acc, b) => {
      const key = dateKey(b.date);
      if (!acc[key]) acc[key] = [];
      acc[key].push(b);
      return acc;
    }, {} as DateGroup);
  }

  // ── Stat chips ──────────────────────────────────────────────────────────
  // Each chip sets every filter dimension it represents, so the list it opens
  // matches the number on it. Search, service and agent filters are kept.
  const chips = [
    {
      label: "Today",
      value: stats.today,
      accent: "#1a1614",
      params: { range: "today", status: "all", unpaid: "", limit: "" },
    },
    {
      label: "This week",
      value: stats.week,
      accent: "#0369a1",
      params: { range: "week", status: "all", unpaid: "", limit: "" },
    },
    {
      label: "Waiting payment",
      value: stats.waiting,
      accent: "#6d28d9",
      params: { range: "all", status: BookingStatus.WAITING_PAYMENT, unpaid: "", limit: "" },
    },
    {
      label: "Confirmed unpaid",
      value: stats.unpaid,
      accent: "#b45309",
      params: { range: "all", status: BookingStatus.CONFIRMED, unpaid: "1", limit: "" },
    },
  ].map((chip) => ({
    ...chip,
    href: buildHref(sp, chip.params),
    active: Object.entries(chip.params)
      .filter(([key]) => key !== "limit")
      .every(([key, val]) => currentValue(sp, key) === (val || PARAM_DEFAULTS[key] || "")),
  }));

  const isFiltered =
    status !== "all" || q !== "" || service !== "all" || agent !== "all" ||
    range !== "upcoming" || unpaid !== "";

  return (
    <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-raleway)] text-2xl sm:text-3xl font-[200] tracking-tight text-[#1a1614]">
          Bookings
        </h1>
        <BookingsHeaderActions query={query} total={total} />
      </div>

      {/* Nav */}
      <div className="mb-5 sm:mb-6 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_LINKS.map((nav) => (
          <Button key={nav.href} asChild variant={nav.variant} className="rounded-full text-xs shrink-0">
            <Link href={nav.href}>{nav.label}</Link>
          </Button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            aria-current={chip.active ? "true" : undefined}
            className={`bg-white rounded-xl px-3.5 py-3 sm:px-4 flex flex-col gap-1 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2 ${
              chip.active
                ? "border-[#1a1614]"
                : "border-[#ece8e3] hover:border-[#d6d0c8]"
            }`}
          >
            <span
              className="font-[family-name:var(--font-raleway)] text-[1.8rem] font-[200] leading-none"
              style={{ color: chip.accent }}
            >
              {chip.value}
            </span>
            <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] sm:text-[0.62rem] tracking-[0.18em] uppercase font-[600] text-[#6b6460]">
              {chip.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Filters — sticky from `sm` up only. Stacked for mobile this card is
          ~230px tall; sticking it would hold a third of a phone screen. */}
      <div className="mb-5 sm:mb-6 sm:sticky sm:top-0 sm:z-20 p-3 sm:p-4 bg-white border border-[#ece8e3] rounded-xl sm:shadow-[0_2px_10px_rgba(26,22,20,0.05)]">
        <BookingsFilters
          total={total}
          agents={allUsers.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
        />
      </div>

      {/* Bookings list */}
      <AgentsProvider agents={allUsers}>
        {bookings.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-[#6b6460] text-sm font-[family-name:var(--font-raleway)]">
              {isFiltered ? "No bookings match your filters." : "No bookings yet."}
            </p>
            {isFiltered && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/bookings">Clear filters</Link>
              </Button>
            )}
          </div>
        ) : sort === "created" ? (
          // ── Flat list, newest booking first ─────────────────────────────
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[700] tracking-[0.1em] uppercase text-[#1a1614]">
                {dir === "asc" ? "Oldest booked first" : "Recently booked"}
              </span>
              <span className="flex-1 h-px bg-[#ece8e3]" />
            </div>
            <div className="space-y-1.5">
              {bookings.map((b) => <BookingComponent key={b.id} booking={b} />)}
            </div>
          </div>
        ) : group === "service" ? (
          // ── Service → Instructor grouping ───────────────────────────────
          Object.entries(byService).map(([svc, byInstructor]) => (
            <div key={svc} className="mb-10">
              <h3 className="font-[family-name:var(--font-raleway)] text-sm font-[700] tracking-[0.12em] uppercase text-[#6b6460] mb-3 pb-2 border-b border-[#ece8e3]">
                {svc}
              </h3>
              {Object.entries(byInstructor).map(([instructor, rows]) => (
                <div key={instructor} className="mb-5">
                  <h4 className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.08em] uppercase font-[600] text-[#6b6460] mb-2">
                    {instructor}
                  </h4>
                  <div className="space-y-1.5">
                    {rows.map((b) => <BookingComponent key={b.id} booking={b} />)}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          // ── Date grouping (default) ───────────────────────────────────
          Object.entries(byDate).map(([key, rows]) => {
            const isToday = key === todayStr;
            const totalPeople = rows.reduce((s, b) => s + b.numberOfPeople + (b.numberOfKids ?? 0), 0);
            return (
              <div key={key} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[700] tracking-[0.1em] uppercase"
                    style={{ color: isToday ? "#b45309" : "#1a1614" }}
                  >
                    {dateLabel(key, todayStr, tomorrowStr)}
                  </span>
                  {isToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                  )}
                  <span className="flex-1 h-px bg-[#ece8e3]" />
                  <Link
                    href={`/bookings/date/${key}`}
                    className="font-[family-name:var(--font-raleway)] text-[0.72rem] sm:text-[0.65rem] tracking-[0.12em] uppercase font-[600] text-[#6b6460] hover:text-[#1a1614] transition-colors shrink-0"
                  >
                    {totalPeople} people →
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {rows.map((b) => <BookingComponent key={b.id} booking={b} />)}
                </div>
              </div>
            );
          })
        )}
      </AgentsProvider>

      {/* Paging */}
      {bookings.length > 0 && (
        <div className="pt-2 pb-6 flex flex-col items-center gap-3">
          <p className="font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.08em] text-[#6b6460]">
            Showing {bookings.length} of {total}
          </p>
          {hasMore && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={buildHref(sp, { limit: String(limit + BOOKINGS_PAGE_SIZE) })}>
                Load {Math.min(BOOKINGS_PAGE_SIZE, total - bookings.length)} more
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingsPage;
