import { getAllBookings, type BookingWithAgent } from "@/lib/actions/booking.actions";
import { listAgents } from "@/lib/actions/user.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { BookingsFilters } from "@/components/bookings/BookingsFilters";
import { Button } from "@/components/ui/button";
import { BookingStatus } from "@prisma/client";
import { format, addDays } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function dateKey(d: Date | string) {
  return format(new Date(d), "yyyy-MM-dd");
}

function dateLabel(key: string, todayStr: string, tomorrowStr: string) {
  if (key === todayStr)    return `Today · ${format(new Date(key), "EEE d MMM")}`;
  if (key === tomorrowStr) return `Tomorrow · ${format(new Date(key), "EEE d MMM")}`;
  return format(new Date(key), "EEE d MMM");
}

async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    service?: string;
    range?: string;
    group?: string;
  }>;
}) {
  const { status, q, service, range = "upcoming", group = "date" } =
    await searchParams;

  const [bookingsResult, allUsers] = await Promise.all([
    getAllBookings(),
    listAgents(),
  ]);
  if (!bookingsResult.success) {
    return <div>Error: {bookingsResult.message}</div>;
  }

  const allBookings = bookingsResult.data as BookingWithAgent[];

  // ── Stats (computed from ALL bookings, before filters) ──────────────────
  const todayStr    = dateKey(new Date());
  const tomorrowStr = dateKey(addDays(new Date(), 1));
  const weekEndStr  = dateKey(addDays(new Date(), 7));

  const statToday       = allBookings.filter((b) => dateKey(b.date) === todayStr).length;
  const statWeek        = allBookings.filter((b) => dateKey(b.date) >= todayStr && dateKey(b.date) <= weekEndStr).length;
  const statWaiting     = allBookings.filter((b) => b.bookingStatus === BookingStatus.WAITING_PAYMENT).length;
  const statUnpaid      = allBookings.filter((b) => b.amountPaidCents === 0 && b.bookingStatus === BookingStatus.CONFIRMED).length;

  // ── Apply filters ───────────────────────────────────────────────────────
  let bookings = allBookings;

  // Status
  if (status && status !== "all" && Object.values(BookingStatus).includes(status as BookingStatus)) {
    bookings = bookings.filter((b) => b.bookingStatus === (status as BookingStatus));
  }

  // Service
  if (service && service !== "all") {
    bookings = bookings.filter((b) => b.service === service);
  }

  // Search
  if (q && q.trim()) {
    const lower = q.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        b.name.toLowerCase().includes(lower) ||
        b.phone.includes(q) ||
        (b.email ?? "").toLowerCase().includes(lower),
    );
  }

  // Date range
  if (range === "today") {
    bookings = bookings.filter((b) => dateKey(b.date) === todayStr);
  } else if (range === "week") {
    bookings = bookings.filter(
      (b) => dateKey(b.date) >= todayStr && dateKey(b.date) <= weekEndStr,
    );
  } else if (range === "upcoming" || !range) {
    bookings = bookings.filter((b) => dateKey(b.date) >= todayStr);
  }
  // range === "all" → no date restriction

  // ── Sort ────────────────────────────────────────────────────────────────
  bookings = [...bookings].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return da - db;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  // ── Group ───────────────────────────────────────────────────────────────
  type DateGroup   = Record<string, BookingWithAgent[]>;
  type ServiceGroup = Record<string, Record<string, BookingWithAgent[]>>;

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

  // ── Stat chip ─────────────────────────────────────────────────────────
  const chips = [
    { label: "Today",           value: statToday,   href: "/bookings?range=today",              accent: "#1a1614" },
    { label: "This week",       value: statWeek,    href: "/bookings?range=week",               accent: "#38bdf8" },
    { label: "Waiting payment", value: statWaiting, href: "/bookings?status=WAITING_PAYMENT",   accent: "#a78bfa" },
    { label: "Confirmed unpaid",value: statUnpaid,  href: "/bookings?status=CONFIRMED",         accent: "#f59e0b" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-raleway)] text-3xl font-[200] tracking-tight text-[#1a1614]">
          Bookings
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/bookings/day-use/new">+ New Day Use</Link>
        </Button>
      </div>

      {/* Nav */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: "Dashboard",   href: "/bookings/dashboard",  variant: "secondary" },
          { label: "Kitesurfing", href: "/bookings/kitesurfing", variant: "outline" },
          { label: "Lessons",     href: "/lessons",              variant: "outline" },
          { label: "Day Use",     href: "/bookings/day-use",     variant: "outline" },
          { label: "Restaurant",  href: "/bookings/restaurant",  variant: "outline" },
          { label: "Schedule",    href: "/bookings/schedule",    variant: "outline" },
        ].map((nav) => (
          <Button key={nav.href} asChild variant={nav.variant as any} className="rounded-full text-xs">
            <Link href={nav.href}>{nav.label}</Link>
          </Button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className="bg-white border border-[#ece8e3] rounded-xl px-4 py-3 flex flex-col gap-1 hover:border-[#d6d0c8] transition-colors"
          >
            <span
              className="font-[family-name:var(--font-raleway)] text-[1.8rem] font-[100] leading-none"
              style={{ color: chip.accent }}
            >
              {chip.value}
            </span>
            <span className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.22em] uppercase font-[600] text-[#8a8480]">
              {chip.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white border border-[#ece8e3] rounded-xl">
        <BookingsFilters total={bookings.length} />
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <p className="text-[#8a8480] text-sm py-10 text-center font-[family-name:var(--font-raleway)]">
          No bookings match your filters.
        </p>
      ) : group === "service" ? (
        // ── Service → Instructor grouping ───────────────────────────────
        Object.entries(byService).map(([svc, byInstructor]) => (
          <div key={svc} className="mb-10">
            <h3 className="font-[family-name:var(--font-raleway)] text-sm font-[700] tracking-[0.12em] uppercase text-[#8a8480] mb-3 pb-2 border-b border-[#ece8e3]">
              {svc}
            </h3>
            {Object.entries(byInstructor).map(([instructor, rows]) => (
              <div key={instructor} className="mb-5">
                <h4 className="font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.08em] uppercase font-[600] text-[#b0a89f] mb-2">
                  {instructor}
                </h4>
                <div className="space-y-1.5">
                  {rows.map((b) => <BookingComponent key={b.id} booking={b} allUsers={allUsers} />)}
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
                  style={{ color: isToday ? "#f59e0b" : "#1a1614" }}
                >
                  {dateLabel(key, todayStr, tomorrowStr)}
                </span>
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                )}
                <span className="flex-1 h-px bg-[#ece8e3]" />
                <Link
                  href={`/bookings/date/${key}`}
                  className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.12em] uppercase font-[600] text-[#b0a89f] hover:text-[#1a1614] transition-colors"
                >
                  {totalPeople} people →
                </Link>
              </div>
              <div className="space-y-1.5">
                {rows.map((b) => <BookingComponent key={b.id} booking={b} allUsers={allUsers} />)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default BookingsPage;
