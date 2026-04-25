import { getBookingCountsByDate } from "@/lib/actions/booking.actions";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_FILTERS: {
  label: string;
  value: string;
  statuses: BookingStatus[];
}[] = [
  { label: "All",       value: "all",       statuses: [] },
  { label: "Confirmed", value: "confirmed", statuses: [BookingStatus.CONFIRMED] },
  {
    label: "Pending",
    value: "pending",
    statuses: [
      BookingStatus.PENDING,
      BookingStatus.REQUEST_SENT,
      BookingStatus.UNDER_REVIEW,
      BookingStatus.WAITING_PAYMENT,
    ],
  },
];

async function BookingsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;

  const activeFilter =
    STATUS_FILTERS.find((f) => f.value === status) ?? STATUS_FILTERS[0];

  const result = await getBookingCountsByDate(
    activeFilter.statuses.length > 0 ? activeFilter.statuses : undefined,
  );

  const counts = result.success
    ? (result.data as { date: string; totalPeople: number; bookingCount: number }[])
    : [];

  const now = new Date();
  const thisMonth = format(now, "yyyy-MM");

  const thisMonthCounts = counts.filter((c) => c.date.startsWith(thisMonth));
  const totalBookingsThisMonth = thisMonthCounts.reduce((s, c) => s + c.bookingCount, 0);
  const totalPeopleThisMonth   = thisMonthCounts.reduce((s, c) => s + c.totalPeople, 0);

  const today       = format(now, "yyyy-MM-dd");
  const futureCounts = counts.filter((c) => c.date >= today);
  const busiestDay  = futureCounts.reduce<{ date: string; totalPeople: number } | null>(
    (best, c) => (!best || c.totalPeople > best.totalPeople ? c : best),
    null,
  );

  const monthLabel = format(now, "MMMM");
  const yearLabel  = format(now, "yyyy");

  return (
    <div className="min-h-screen bg-[#faf9f7]">

      {/* ── Header panel ── */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-0">

          {/* Top bar: back + new booking */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] transition-colors duration-150"
            >
              ← Bookings
            </Link>
            <Link
              href="/kitesurfing/booking"
              className="inline-flex items-center gap-2 bg-[#1a1614] text-white text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 py-2.5 font-[family-name:var(--font-raleway)] hover:bg-[#2a2420] transition-colors duration-200"
            >
              + New Booking
            </Link>
          </div>

          {/* Month headline */}
          <div className="flex items-baseline gap-4 mb-1">
            <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(3.5rem,10vw,7rem)] font-[100] tracking-[-0.03em] text-[#1a1614] leading-none">
              {monthLabel}
            </h1>
            <span className="font-[family-name:var(--font-raleway)] text-[clamp(1rem,2.5vw,1.8rem)] font-[100] text-[#b0a89f] tracking-[-0.01em] mb-1 self-end">
              {yearLabel}
            </span>
          </div>
          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-8">
            Bookings Dashboard
          </p>

          {/* ── Filter tabs ── */}
          <div className="flex gap-0 border-b border-[#ece8e3]">
            {STATUS_FILTERS.map((f) => {
              const isActive = activeFilter.value === f.value;
              return (
                <Link
                  key={f.value}
                  href={
                    f.value === "all"
                      ? "/bookings/dashboard"
                      : `/bookings/dashboard?status=${f.value}`
                  }
                  className="relative pb-3 mr-7 font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] transition-colors duration-150"
                  style={{ color: isActive ? "#1a1614" : "#8a8480" }}
                >
                  {f.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a1614]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-3 border-b border-[#ece8e3]">
          {/* Stat: Bookings this month */}
          <div className="py-10 pr-8 border-r border-[#ece8e3]">
            <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.3em] uppercase font-[600] text-[#8a8480] mb-3">
              Bookings · {format(now, "MMM")}
            </p>
            <p className="font-[family-name:var(--font-raleway)] text-[clamp(2.8rem,6vw,5rem)] font-[100] leading-none tracking-[-0.02em] text-[#1a1614]">
              {totalBookingsThisMonth}
            </p>
          </div>

          {/* Stat: People this month */}
          <div className="py-10 px-8 border-r border-[#ece8e3]">
            <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.3em] uppercase font-[600] text-[#8a8480] mb-3">
              People · {format(now, "MMM")}
            </p>
            <p className="font-[family-name:var(--font-raleway)] text-[clamp(2.8rem,6vw,5rem)] font-[100] leading-none tracking-[-0.02em] text-[#1a1614]">
              {totalPeopleThisMonth}
            </p>
          </div>

          {/* Stat: Busiest upcoming day */}
          <div className="py-10 pl-8">
            <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.3em] uppercase font-[600] text-[#8a8480] mb-3">
              Busiest Upcoming Day
            </p>
            {busiestDay ? (
              <Link
                href={`/bookings/date/${busiestDay.date}`}
                className="group block"
              >
                <p className="font-[family-name:var(--font-raleway)] text-[clamp(2.8rem,6vw,5rem)] font-[100] leading-none tracking-[-0.02em] text-[#1a1614] group-hover:text-[#f59e0b] transition-colors duration-200">
                  {format(new Date(busiestDay.date), "MMM d")}
                </p>
                <p className="font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.12em] uppercase font-[500] text-[#8a8480] mt-2 group-hover:text-[#f59e0b] transition-colors duration-200">
                  {busiestDay.totalPeople} people →
                </p>
              </Link>
            ) : (
              <p className="font-[family-name:var(--font-raleway)] text-[clamp(2.8rem,6vw,5rem)] font-[100] leading-none text-[#d6d0c8]">
                —
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white border border-[#ece8e3]">
          {/* Calendar header */}
          <div className="flex items-center gap-3 px-8 pt-7 pb-5 border-b border-[#ece8e3]">
            <span className="h-px w-7 shrink-0 bg-[#f59e0b]" />
            <span className="text-[0.58rem] tracking-[0.32em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#f59e0b]">
              Calendar
            </span>
            <span className="text-[0.58rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#b0a89f]">
              Click a date to see bookings
            </span>
          </div>

          <div className="px-4 py-6">
            <BookingCalendar counts={counts} />
          </div>
        </div>

        {/* Quick nav links */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-[#ece8e3]">
          <p className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
            View by service
          </p>
          {[
            { label: "Kitesurfing", href: "/bookings/kitesurfing", accent: "#38bdf8" },
            { label: "Day Use",     href: "/bookings/day-use",     accent: "#fbbf24" },
            { label: "Restaurant",  href: "/bookings/restaurant",  accent: "#fb923c" },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="group inline-flex items-center gap-2 font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] text-[#5a5450] hover:text-[#1a1614] transition-colors duration-150"
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
