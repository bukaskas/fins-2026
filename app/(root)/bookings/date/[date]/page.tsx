import { getBookingsByDate } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { BookingStatus, type Booking } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { SearchInput } from "./SearchInput";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_FILTERS: {
  label: string;
  value: string;
  statuses: BookingStatus[];
}[] = [
  { label: "All",               value: "all",       statuses: [] },
  { label: "Confirmed",         value: "confirmed", statuses: [BookingStatus.CONFIRMED] },
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
  {
    label: "Declined / Expired",
    value: "declined",
    statuses: [
      BookingStatus.DECLINED,
      BookingStatus.NO_RESPONSE_EXPIRED,
      BookingStatus.CANCELED,
    ],
  },
];

// Human-readable service names
const SERVICE_LABELS: Record<string, string> = {
  "kitesurfing-course": "Kitesurfing",
  "day-use":            "Day Use",
  "restaurant":         "Restaurant",
};

// Eyebrow accent color per service
const SERVICE_ACCENT: Record<string, string> = {
  "kitesurfing-course": "#38bdf8",
  "day-use":            "#fbbf24",
  "restaurant":         "#fb923c",
};

async function BookingsByDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ date }, { status = "all", q = "" }] = await Promise.all([
    params,
    searchParams,
  ]);

  const activeFilter =
    STATUS_FILTERS.find((f) => f.value === status) ?? STATUS_FILTERS[0];

  const [filteredResult, allResult] = await Promise.all([
    getBookingsByDate(
      date,
      activeFilter.statuses.length > 0 ? activeFilter.statuses : undefined,
    ),
    getBookingsByDate(date),
  ]);

  if (!filteredResult.success) {
    return <div>Error: {filteredResult.message}</div>;
  }

  const allBookings = allResult.success ? (allResult.data as Booking[]) : [];

  const query = q.trim().toLowerCase();
  const rawBookings = filteredResult.data as Booking[];
  const bookings = query
    ? rawBookings.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.email?.toLowerCase().includes(query) ||
          b.phone?.toLowerCase().includes(query),
      )
    : rawBookings;

  const peopleByStatus = {
    confirmed:      allBookings.filter((b) => b.bookingStatus === BookingStatus.CONFIRMED).reduce((s, b) => s + b.numberOfPeople, 0),
    requestSent:    allBookings.filter((b) => b.bookingStatus === BookingStatus.REQUEST_SENT).reduce((s, b) => s + b.numberOfPeople, 0),
    waitingPayment: allBookings.filter((b) => b.bookingStatus === BookingStatus.WAITING_PAYMENT).reduce((s, b) => s + b.numberOfPeople, 0),
    rest:           allBookings.filter((b) => !([ BookingStatus.CONFIRMED, BookingStatus.REQUEST_SENT, BookingStatus.WAITING_PAYMENT] as BookingStatus[]).includes(b.bookingStatus)).reduce((s, b) => s + b.numberOfPeople, 0),
  };

  // Group by service
  const grouped = bookings.reduce(
    (acc, booking) => {
      const service = booking.service || "Unknown";
      if (!acc[service]) acc[service] = [];
      acc[service].push(booking);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );

  // People count per status filter tab, derived from all bookings
  const statusPeople = STATUS_FILTERS.map((f) => {
    const matched =
      f.statuses.length === 0
        ? allBookings
        : allBookings.filter((b) => f.statuses.includes(b.bookingStatus));
    return { value: f.value, people: matched.reduce((s, b) => s + b.numberOfPeople, 0) };
  });

  const dayLabel   = format(new Date(date), "EEEE");
  const dateLabel  = format(new Date(date), "MMMM d");
  const yearLabel  = format(new Date(date), "yyyy");
  const baseHref   = `/bookings/date/${date}`;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-6">

          {/* Back link */}
          <Link
            href="/bookings/dashboard"
            className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-[#8a8480] hover:text-[#1a1614] transition-colors duration-150 mb-6"
          >
            <span>←</span> Dashboard
          </Link>

          {/* Date + stats */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-1">
                {dayLabel} · {yearLabel}
              </p>
              <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3.5rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none">
                {dateLabel}
              </h1>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <StatusPeopleChip color="#22c55e" label="Confirmed"        value={peopleByStatus.confirmed} />
                <span className="text-[#d6d0c8]">·</span>
                <StatusPeopleChip color="#38bdf8" label="Request Sent"     value={peopleByStatus.requestSent} />
                <span className="text-[#d6d0c8]">·</span>
                <StatusPeopleChip color="#a78bfa" label="Waiting Payment"  value={peopleByStatus.waitingPayment} />
                <span className="text-[#d6d0c8]">·</span>
                <StatusPeopleChip color="#9ca3af" label="Other"            value={peopleByStatus.rest} />
              </div>
            </div>

            <Link
              href="/day-use/booking"
              className="inline-flex items-center gap-2 bg-[#1a1614] text-white text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 py-2.5 font-[family-name:var(--font-raleway)] hover:bg-[#2a2420] transition-colors duration-200 shrink-0"
            >
              + New Booking
            </Link>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-0 mt-8 border-b border-[#ece8e3]">
            {STATUS_FILTERS.map((f) => {
              const href = `${baseHref}?status=${f.value === "all" ? "" : f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`.replace("status=&", "");
              const isActive = activeFilter.value === f.value;
              const people = statusPeople.find((s) => s.value === f.value)?.people ?? 0;
              return (
                <Link
                  key={f.value}
                  href={f.value === "all" ? (q ? `${baseHref}?q=${encodeURIComponent(q)}` : baseHref) : href}
                  className="relative pb-3 mr-6 font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] transition-colors duration-150"
                  style={{ color: isActive ? "#1a1614" : "#8a8480" }}
                >
                  <span>{f.label}</span>
                  <span
                    className="ml-1.5 text-[0.6rem] font-[500] tabular-nums"
                    style={{ color: isActive ? "#3d3633" : "#b0a89f" }}
                  >
                    {people}p
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a1614]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Search ── */}
          <SearchInput defaultValue={q} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.2em] uppercase text-[#b0a89f]">
              No{activeFilter.value !== "all" ? ` ${activeFilter.label.toLowerCase()}` : ""} bookings
              {query ? ` matching "${q}"` : " for this date"}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([service, serviceBookings]) => {
              const accent = SERVICE_ACCENT[service] ?? "#8a8480";
              const serviceLabel = SERVICE_LABELS[service] ?? service.replace(/-/g, " ");

              if (service === "kitesurfing-course") {
                const byInstructor = serviceBookings.reduce(
                  (acc, b) => {
                    const instructor = b.instructor || "Unassigned";
                    if (!acc[instructor]) acc[instructor] = [];
                    acc[instructor].push(b);
                    return acc;
                  },
                  {} as Record<string, Booking[]>,
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
                          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.28em] uppercase font-[500] text-[#8a8480] mb-2 pl-1">
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
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function StatusPeopleChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 font-[family-name:var(--font-raleway)] text-[0.72rem]">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[#8a8480]">{label}</span>
      <span className="font-[700] tabular-nums" style={{ color: value > 0 ? "#3d3633" : "#b0a89f" }}>{value}</span>
    </span>
  );
}

function ServiceHeader({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-7 shrink-0" style={{ background: accent }} />
      <span
        className="text-[0.58rem] tracking-[0.32em] uppercase font-[family-name:var(--font-raleway)] font-[600]"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="text-[0.58rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#b0a89f]">
        {count} {count === 1 ? "booking" : "bookings"}
      </span>
    </div>
  );
}

export default BookingsByDatePage;
