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
import { BookingsNavigation } from "@/components/bookings/BookingsNavigation";
import { Button } from "@/components/ui/button";
import { BOOKINGS_PAGE_SIZE } from "@/lib/constants";
import { BookingStatus, Role } from "@prisma/client";
import { addDays, format } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { serviceLabel } from "@/lib/bookings/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Booking dates are stored as UTC midnights and rendered from their UTC parts,
// so day keys are derived in UTC too — otherwise a server west of Greenwich
// would file a booking under the previous day.
function dateKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

function dateLabel(key: string, todayStr: string, tomorrowStr: string) {
  // Midday keeps the label on the intended day in any server timezone.
  const day = new Date(`${key}T12:00:00`);
  if (key === todayStr) return `Today · ${format(day, "EEE d MMM")}`;
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
  if (!roleHasCapability(role, "bookings:manage")) {
    redirect("/");
  }

  const parsedLimit = Number.parseInt(sp.limit ?? "", 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : BOOKINGS_PAGE_SIZE;

  // Everything below is filtered, sorted and counted by Postgres — this page
  // only groups the rows it was handed.
  const query: BookingsQuery = {
    status,
    q,
    service,
    agent,
    range,
    sort,
    dir,
    unpaid,
    limit,
  };

  const [page, allUsers] = await Promise.all([
    getBookingsPage(query),
    listAgents(),
  ]);
  const { rows: bookings, total, hasMore, stats } = page;

  const todayStr = dateKey(new Date());
  const tomorrowStr = dateKey(addDays(new Date(), 1));

  // ── Group ───────────────────────────────────────────────────────────────
  type DateGroup = Record<string, BookingRow[]>;
  type ServiceGroup = Record<string, Record<string, BookingRow[]>>;

  let byDate: DateGroup = {};
  let byService: ServiceGroup = {};

  if (group === "service") {
    byService = bookings.reduce((acc, b) => {
      const svc = b.service || "Unknown";
      const inst = b.instructor || "Unassigned";
      if (!acc[svc]) acc[svc] = {};
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
      params: {
        range: "all",
        status: BookingStatus.WAITING_PAYMENT,
        unpaid: "",
        limit: "",
      },
    },
    {
      label: "Confirmed unpaid",
      value: stats.unpaid,
      accent: "#b45309",
      params: {
        range: "all",
        status: BookingStatus.CONFIRMED,
        unpaid: "1",
        limit: "",
      },
    },
  ].map((chip) => ({
    ...chip,
    href: buildHref(sp, chip.params),
    active: Object.entries(chip.params)
      .filter(([key]) => key !== "limit")
      .every(
        ([key, val]) =>
          currentValue(sp, key) === (val || PARAM_DEFAULTS[key] || ""),
      ),
  }));

  const isFiltered =
    status !== "all" ||
    q !== "" ||
    service !== "all" ||
    agent !== "all" ||
    range !== "upcoming" ||
    unpaid !== "";

  return (
    <div className="min-h-[calc(100svh-6rem)] bg-[#faf9f7] text-[#1a1614]">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h1 className="font-[family-name:var(--font-raleway)] text-[1.85rem] font-[600] tracking-[-0.025em] text-[#1a1614] sm:text-[2.15rem]">
            Bookings
          </h1>
          <BookingsHeaderActions query={query} total={total} />
        </div>

        <div className="mb-6">
          <BookingsNavigation />
        </div>

        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              aria-current={chip.active ? "true" : undefined}
              className={`flex min-h-[5.25rem] flex-col justify-between gap-1 rounded-2xl border px-3.5 py-3 shadow-[0_1px_5px_rgba(26,22,20,0.055)] transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2 sm:px-4 ${
                chip.active
                  ? "border-[#1a1614] bg-[#f5f2ef] shadow-none"
                  : "border-[#ece8e3] bg-white hover:border-[#d6d0c8] hover:shadow-[0_2px_8px_rgba(26,22,20,0.08)]"
              }`}
            >
              <span
                className="font-[family-name:var(--font-raleway)] text-[1.65rem] font-[500] leading-none tracking-[-0.025em]"
                style={{ color: chip.accent }}
              >
                {chip.value}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[650] uppercase tracking-[0.12em] text-[#6b6460] sm:text-[0.68rem]">
                {chip.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Filters — sticky from `sm` up only. Stacked for mobile this card is
          ~230px tall; sticking it would hold a third of a phone screen. */}
        <div className="mb-6 rounded-2xl border border-[#ece8e3] bg-white p-3 shadow-[0_1px_6px_rgba(26,22,20,0.065)] sm:sticky sm:top-[6.5rem] sm:z-20 sm:p-4 md:top-[7.25rem]">
          <BookingsFilters
            total={total}
            agents={allUsers.map((u) => ({
              id: u.id,
              label: u.name ?? u.email,
            }))}
          />
        </div>

        {/* Bookings list */}
        <AgentsProvider agents={allUsers}>
          {bookings.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-[#6b6460] text-sm font-[family-name:var(--font-raleway)]">
                {isFiltered
                  ? "No bookings match your filters."
                  : "No bookings yet."}
              </p>
              {isFiltered && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="min-h-10 rounded-full border-[#ece8e3] bg-white px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-[#f5f2ef] hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
                >
                  <Link href="/bookings">Clear filters</Link>
                </Button>
              )}
            </div>
          ) : sort === "created" ? (
            // ── Flat list, newest booking first ─────────────────────────────
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[700] uppercase tracking-[0.08em] text-[#1a1614]">
                  {dir === "asc" ? "Oldest booked first" : "Recently booked"}
                </h2>
                <span className="flex-1 h-px bg-[#ece8e3]" />
              </div>
              <div className="space-y-1.5">
                {bookings.map((b) => (
                  <BookingComponent key={b.id} booking={b} />
                ))}
              </div>
            </div>
          ) : group === "service" ? (
            // ── Service → Instructor grouping ───────────────────────────────
            Object.entries(byService).map(([svc, byInstructor]) => (
              <div key={svc} className="mb-10">
                <h2 className="mb-3 border-b border-[#ece8e3] pb-2 font-[family-name:var(--font-raleway)] text-sm font-[700] uppercase tracking-[0.1em] text-[#1a1614]">
                  {serviceLabel(svc)}
                </h2>
                {Object.entries(byInstructor).map(([instructor, rows]) => (
                  <div key={instructor} className="mb-5">
                    <h3 className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.08em] uppercase font-[600] text-[#6b6460] mb-2">
                      {instructor}
                    </h3>
                    <div className="space-y-1.5">
                      {rows.map((b) => (
                        <BookingComponent key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            // ── Date grouping (default) ───────────────────────────────────
            Object.entries(byDate).map(([key, rows]) => {
              const isToday = key === todayStr;
              const totalPeople = rows.reduce(
                (s, b) => s + b.numberOfPeople + (b.numberOfKids ?? 0),
                0,
              );
              return (
                <div key={key} className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h2
                      className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[700] uppercase tracking-[0.08em]"
                      style={{ color: isToday ? "#b45309" : "#1a1614" }}
                    >
                      {dateLabel(key, todayStr, tomorrowStr)}
                    </h2>
                    {isToday && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-1 h-px bg-[#ece8e3]" />
                    <Link
                      href={`/bookings/date/${key}`}
                      aria-label={`Open all bookings for ${dateLabel(key, todayStr, tomorrowStr)}`}
                      className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-2 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.08em] text-[#6b6460] transition-colors hover:bg-white hover:text-[#1a1614] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2 sm:text-[0.68rem]"
                    >
                      {totalPeople} people
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    {rows.map((b) => (
                      <BookingComponent key={b.id} booking={b} />
                    ))}
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
              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-full border-[#ece8e3] bg-white px-5 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-[#f5f2ef] hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
              >
                <Link
                  href={buildHref(sp, {
                    limit: String(limit + BOOKINGS_PAGE_SIZE),
                  })}
                >
                  Load {Math.min(BOOKINGS_PAGE_SIZE, total - bookings.length)}{" "}
                  more
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingsPage;
