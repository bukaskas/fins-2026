import { getBookingCountsByDate } from "@/lib/actions/booking.actions";
import { getClosedDates } from "@/lib/actions/closedDate.actions";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import {
  CALENDAR_FILTERS,
  parseCalendarFilter,
  peopleFor,
  visibleSlices,
  type CalendarFilter,
  type DayCount,
} from "@/lib/bookings/calendar-counts";
import { SERVICE_META } from "@/lib/bookings/status";
import { format, addMonths, endOfMonth, startOfMonth } from "date-fns";
import Link from "next/link";
import { AlertTriangle, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

// Shown in place of the busiest-day line when the month has nothing to show.
const EMPTY_MONTH: Record<CalendarFilter, string> = {
  all: "No bookings",
  confirmed: "No confirmed bookings",
  payment: "Nobody waiting to pay",
  review: "Nothing to review",
};

function dashboardHref(filter: CalendarFilter, month: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  params.set("month", month);
  return `/bookings/dashboard?${params.toString()}`;
}

async function BookingsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const filter = parseCalendarFilter(sp.status);

  // getBookingCountsByDate covers 3 months back to 3 months ahead; the
  // calendar can't page outside that, and ?month= is clamped to it.
  const now = new Date();
  const thisMonth = format(now, "yyyy-MM");
  const firstMonth = format(addMonths(now, -3), "yyyy-MM");
  const lastMonth = format(addMonths(now, 3), "yyyy-MM");
  const requested = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : thisMonth;
  const month =
    requested < firstMonth ? firstMonth : requested > lastMonth ? lastMonth : requested;

  const [result, closedResult] = await Promise.all([
    getBookingCountsByDate(),
    getClosedDates(
      startOfMonth(addMonths(now, -3)),
      endOfMonth(addMonths(now, 3)),
    ),
  ]);

  const countsFailed = !result.success;
  const closedFailed = !closedResult.success;
  const counts = result.success ? (result.data as DayCount[]) : [];

  const closedDateStrings = closedResult.success
    ? closedResult.data.map((cd) => new Date(cd.date).toISOString().slice(0, 10))
    : [];

  // Busiest day in the month on screen, for the slice the tabs pick. In the
  // current month only the days still ahead count.
  const today = format(now, "yyyy-MM-dd");
  const monthName = format(new Date(`${month}-01T00:00:00`), "MMMM");
  const busiestDay = counts
    .filter((c) => c.date.startsWith(month) && (month !== thisMonth || c.date >= today))
    .reduce<{ date: string; people: number } | null>((best, c) => {
      const people = peopleFor(filter, c);
      return people > 0 && (!best || people > best.people)
        ? { date: c.date, people }
        : best;
    }, null);
  const busiestLabel =
    month === thisMonth ? `Busiest day left in ${monthName}` : `Busiest day in ${monthName}`;
  const reloadHref = dashboardHref(filter, month);

  return (
    <div className="min-h-screen bg-paper [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-ink">
      {/* ── Header panel ── */}
      <div className="bg-white border-b border-paper-line">
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-0 sm:px-6 sm:pt-8">
          {/* Top bar — phone: back + primary on one row, secondary links below */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 sm:justify-start">
            <Link
              href="/bookings"
              className="order-1 inline-flex min-h-11 items-center gap-1.5 text-[0.75rem] tracking-[0.14em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-ink-muted hover:text-ink transition-colors duration-150"
            >
              ← Bookings
            </Link>
            <Link
              href="/day-use/booking"
              className="order-2 inline-flex min-h-11 items-center gap-2 bg-ink text-white text-[0.75rem] font-[700] tracking-[0.12em] uppercase px-5 font-[family-name:var(--font-raleway)] hover:bg-ink-hover transition-colors duration-200 sm:order-4"
            >
              + New Booking
            </Link>
            <div className="order-3 flex w-full gap-2 sm:ml-auto sm:w-auto sm:gap-3">
              <Link
                href="/bookings/agents"
                className="flex-1 justify-center min-h-11 inline-flex items-center gap-1.5 text-[0.75rem] tracking-[0.14em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-ink-muted hover:text-ink border border-paper-line px-4 hover:border-paper-line-strong transition-colors duration-200 sm:flex-none"
              >
                Team Stats
              </Link>
              <Link
                href="/bookings/closed-dates"
                className="flex-1 justify-center min-h-11 inline-flex items-center gap-1.5 text-[0.75rem] tracking-[0.14em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-ink-muted hover:text-ink border border-paper-line px-4 hover:border-paper-line-strong transition-colors duration-200 sm:flex-none"
              >
                Closed Dates
              </Link>
              <Link
                href="/bookings/settings"
                aria-label="Booking settings"
                title="Booking settings"
                className="inline-flex size-11 shrink-0 items-center justify-center text-ink-muted hover:text-ink border border-paper-line hover:border-paper-line-strong transition-colors duration-200"
              >
                <Settings className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-raleway)] text-[1.75rem] sm:text-[2rem] font-[600] tracking-[-0.02em] text-ink leading-tight mb-4 sm:mb-6">
            Bookings calendar
          </h1>

          {/* ── Filter tabs: pick which numbers the calendar shows ── */}
          <nav
            aria-label="Show on calendar"
            className="-mx-4 flex overflow-x-auto border-b border-paper-line px-4 sm:mx-0 sm:px-0"
          >
            {CALENDAR_FILTERS.map((f) => {
              const isActive = filter === f.value;
              return (
                <Link
                  key={f.value}
                  href={dashboardHref(f.value, month)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex min-h-11 shrink-0 items-center whitespace-nowrap mr-5 last:mr-0 sm:mr-7 font-[family-name:var(--font-raleway)] text-[0.875rem] font-[600] transition-colors duration-150 hover:text-ink ${isActive ? "text-ink" : "text-ink-muted"}`}
                >
                  {f.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {(countsFailed || closedFailed) && (
        <div className="max-w-5xl mx-auto px-4 pt-6 sm:px-6">
          <div
            role="alert"
            className="flex items-start gap-3 border border-alert-line bg-alert-bg px-5 py-4"
          >
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-alert-icon"
              aria-hidden="true"
            />
            <div className="min-w-0 font-[family-name:var(--font-raleway)]">
              <p className="text-[0.875rem] font-[700] text-alert-ink">
                {countsFailed
                  ? "Booking numbers didn’t load"
                  : "Closed dates didn’t load"}
              </p>
              <p className="mt-1 text-[0.875rem] font-[400] leading-[1.5] text-alert-ink">
                {countsFailed
                  ? "The calendar counts below are missing, not zero. Don’t quote availability from this page until it loads."
                  : "Closed days aren’t marked on the calendar. Check Closed Dates before promising a date."}{" "}
                {countsFailed && closedFailed &&
                  "Closed days aren’t marked either. "}
                <Link
                  href={reloadHref}
                  className="font-[700] underline underline-offset-2 hover:text-ink"
                >
                  Reload
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        <div className="bg-white border border-paper-line">
          {/* Calendar header: what the numbers mean + busiest day */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-b sm:px-8 sm:py-3 border-paper-line font-[family-name:var(--font-raleway)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[0.875rem] font-[500] text-ink-soft">
              <span className="text-ink-muted">People per date:</span>
              <ul className="contents">
                {visibleSlices(filter).map((slice) => (
                  <li key={slice.value} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0"
                      style={{ background: slice.color }}
                    />
                    <span style={{ color: slice.color }} className="font-[700]">
                      {slice.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {!busiestDay && !countsFailed && (
              <p className="py-2 sm:ml-auto text-[0.875rem] font-[500] text-ink-muted">
                {EMPTY_MONTH[filter]} {month === thisMonth ? "left in" : "in"} {monthName}
              </p>
            )}
            {busiestDay && (
              <Link
                href={`/bookings/date/${busiestDay.date}`}
                className="inline-flex min-h-11 items-center gap-1.5 sm:ml-auto text-[0.875rem] font-[500] text-ink-muted hover:text-ink transition-colors duration-150"
              >
                {busiestLabel}:
                <span className="font-[700] tabular-nums text-ink">
                  {format(new Date(`${busiestDay.date}T00:00:00`), "EEE d MMM")}
                </span>
                · {busiestDay.people} people →
              </Link>
            )}
          </div>

          <div className="px-1 py-4 sm:px-4 sm:py-6">
            <BookingCalendar
              counts={counts}
              closedDates={closedDateStrings}
              filter={filter}
              month={month}
              firstMonth={firstMonth}
              lastMonth={lastMonth}
            />
          </div>
          <p className="border-t border-paper-line px-4 py-3 text-[0.875rem] text-ink-muted sm:px-8 font-[family-name:var(--font-raleway)]">
            Tap a date to see its bookings.
          </p>
        </div>

        {/* Quick nav links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-8 pt-6 border-t border-paper-line">
          <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.14em] uppercase font-[600] text-ink-muted w-full sm:w-auto">
            View by service
          </p>
          {[
            {
              label: "Kitesurfing",
              href: "/bookings/kitesurfing",
              accent: SERVICE_META["kitesurfing-course"].dot,
            },
            { label: "Lessons", href: "/lessons", accent: "#34d399" },
            { label: "Day Use", href: "/bookings/day-use", accent: SERVICE_META["day-use"].dot },
            {
              label: "Restaurant",
              href: "/bookings/restaurant",
              accent: SERVICE_META.restaurant.dot,
            },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="group inline-flex min-h-11 items-center gap-2 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.1em] uppercase font-[600] text-ink-soft hover:text-ink transition-colors duration-150"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: nav.accent }}
              />
              {nav.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookingsDashboardPage;
