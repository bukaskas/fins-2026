import Link from "next/link";
import type { ReactNode } from "react";
import { BookingStatus } from "@prisma/client";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
  Users,
} from "lucide-react";

import {
  getReceptionDashboard,
  type ReceptionBookingRow,
  type ReceptionDashboardData,
} from "@/lib/actions/booking.actions";
import { BookingQuickActions } from "@/components/reception/BookingQuickActions";
import { ContactActions } from "@/components/reception/ContactActions";
import { PaymentDeadline } from "@/components/reception/PaymentDeadline";
import { ReceptionAutoRefresh } from "@/components/reception/ReceptionAutoRefresh";
import { BookingStatusBadge } from "@/components/bookings/StatusBadge";
import { formatEGP } from "@/lib/commission";
import { DAILY_CAPACITY } from "@/lib/constants";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
  "day-use": "Day Use",
  "kitesurfing-course": "Kitesurfing course",
  restaurant: "Restaurant",
  "pharaoh-airstyle": "Pharaoh Airstyle",
  corporate: "Corporate booking",
};

function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service.replaceAll("-", " ");
}

function businessDateLabel(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shortDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function requestAge(createdAt: Date, now: Date): string {
  const hours = Math.max(0, (now.getTime() - createdAt.getTime()) / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(hours * 60))}m waiting`;
  if (hours < 24) return `${Math.floor(hours)}h waiting`;
  return `${Math.floor(hours / 24)}d waiting`;
}

function lastContactLabel(booking: ReceptionBookingRow): string {
  if (!booking.lastContact) return "Not contacted yet";
  const actor = booking.lastContact.actorName
    ? ` by ${booking.lastContact.actorName}`
    : "";
  return `Last contact ${booking.lastContact.createdAt.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  })}${actor}`;
}

function BookingLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/bookings/${id}`}
      className="rounded-sm font-semibold text-[#22303F] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
    >
      {name}
    </Link>
  );
}

function AllClear({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-3 text-sm text-[#5B6B7C]">
      <CheckCircle2 className="size-4 text-teal-700" aria-hidden="true" />
      {text}
    </div>
  );
}

function PaymentState({ booking }: { booking: ReceptionBookingRow }) {
  if (booking.paymentState === "UNKNOWN") {
    return <span className="text-[#5B6B7C]">Price not recorded</span>;
  }
  if (booking.paymentState === "PAID") {
    return <span className="font-medium text-teal-800">Fully paid</span>;
  }
  return (
    <span className="font-semibold text-red-700">
      {formatEGP(booking.dueCents ?? 0)} due
    </span>
  );
}

function TodayBookingRow({ booking }: { booking: ReceptionBookingRow }) {
  const people = booking.numberOfPeople + (booking.numberOfKids ?? 0);

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-center justify-between sm:block">
        <span className="font-[family-name:var(--font-roboto-mono)] text-sm font-semibold tabular-nums text-[#22303F]">
          {booking.time || "Time not set"}
        </span>
        <span className="sm:hidden">
          <BookingStatusBadge status={booking.bookingStatus} />
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <BookingLink id={booking.id} name={booking.name} />
          <span className="hidden sm:inline-flex">
            <BookingStatusBadge status={booking.bookingStatus} />
          </span>
        </div>
        <p className="mt-1 break-words text-sm text-[#5B6B7C]">
          {serviceLabel(booking.service)} · {people} {people === 1 ? "guest" : "guests"} ·{" "}
          <PaymentState booking={booking} />
        </p>
      </div>

      <div className="flex w-full items-center justify-end sm:w-auto">
        {booking.bookingStatus === BookingStatus.CONFIRMED ? (
          <BookingQuickActions
            bookingId={booking.id}
            actions={[
              {
                label: "Mark arrived",
                status: BookingStatus.ARRIVED,
                variant: "default",
              },
            ]}
          />
        ) : booking.bookingStatus === BookingStatus.ARRIVED ? (
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-teal-100 px-3 text-xs font-semibold text-teal-800">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Arrived
          </span>
        ) : (
          <Link
            href={`/bookings/${booking.id}`}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-[#8898aa]/35 px-3 text-sm font-semibold text-[#22303F] outline-none hover:bg-[#D6E0EA] focus-visible:ring-2 focus-visible:ring-[#0EA5E9] sm:min-h-9 sm:w-auto"
          >
            Open booking <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  booking,
  generatedAt,
}: {
  booking: ReceptionBookingRow;
  generatedAt: Date;
}) {
  const actions = [
    ...(booking.bookingStatus === BookingStatus.PENDING
      ? [
          {
            label: "Request guest info",
            status: BookingStatus.REQUEST_SENT,
            variant: "outline" as const,
          },
        ]
      : []),
    {
      label: "Approve & create payment link",
      status: BookingStatus.WAITING_PAYMENT,
      variant: "default" as const,
    },
    {
      label: "Decline",
      status: BookingStatus.DECLINED,
      variant: "destructive" as const,
      confirm: `Decline ${booking.name}'s booking for ${shortDateLabel(booking.date)}?`,
    },
  ];

  return (
    <div className="space-y-3 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <BookingLink id={booking.id} name={booking.name} />
          <BookingStatusBadge status={booking.bookingStatus} />
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {requestAge(booking.createdAt, generatedAt)}
          </span>
        </div>
        <p className="mt-1 break-words text-sm text-[#5B6B7C]">
          {booking.time ? `${booking.time} · ` : ""}
          {serviceLabel(booking.service)} · {booking.numberOfPeople + booking.numberOfKids} guests
        </p>
      </div>
      <BookingQuickActions bookingId={booking.id} actions={actions} />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 bg-[#E3EBF3] p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#D6E0EA] text-[#22303F]">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6B7C]">
          {label}
        </dt>
        <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xl font-semibold tabular-nums text-[#22303F]">
            {value}
          </span>
          <span className="text-xs text-[#5B6B7C]">{detail}</span>
        </dd>
      </div>
    </div>
  );
}

export default async function ReceptionPage() {
  const data: ReceptionDashboardData = await getReceptionDashboard();
  const {
    businessDate,
    generatedAt,
    summary,
    todayBookings,
    reviewToday,
    reviewTotal,
    contactUpcoming,
    contactTotal,
    capacity,
  } = data;

  return (
    <main className="min-h-screen bg-[#E3EBF3] text-[#22303F]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-raleway)] text-3xl font-semibold tracking-[-0.02em]">
              Reception desk
            </h1>
            <p className="mt-1 text-sm text-[#5B6B7C]">
              {businessDateLabel(businessDate)} · Today first, oldest requests first
            </p>
          </div>
          <ReceptionAutoRefresh generatedAt={generatedAt.toISOString()} />
        </header>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#8898aa]/30 bg-[#8898aa]/25 shadow-raised-sm lg:grid-cols-4">
          <Metric
            icon={<CalendarDays className="size-4" aria-hidden="true" />}
            label="Today"
            value={summary.todayBookings}
            detail={`${summary.todayGuests} guests`}
          />
          <Metric
            icon={<ClipboardCheck className="size-4" aria-hidden="true" />}
            label="Review today"
            value={summary.reviewToday}
            detail="oldest first"
          />
          <Metric
            icon={<MessageCircle className="size-4" aria-hidden="true" />}
            label="Needs contact"
            value={summary.contactUpcoming}
            detail="upcoming"
          />
          <Metric
            icon={<Users className="size-4" aria-hidden="true" />}
            label="Arrived"
            value={summary.arrivedToday}
            detail={`of ${summary.todayBookings}`}
          />
        </dl>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(21rem,1fr)]">
          <section
            aria-labelledby="today-heading"
            className="overflow-hidden rounded-2xl border border-[#8898aa]/30 bg-[#E3EBF3] shadow-raised-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8898aa]/25 px-4 py-4 sm:px-5">
              <div>
                <h2 id="today-heading" className="text-lg font-semibold">
                  Today&apos;s bookings
                </h2>
                <p className="mt-0.5 text-xs text-[#5B6B7C]">
                  Every active booking, ordered by scheduled time
                </p>
              </div>
              <Link
                href={`/bookings/date/${businessDate}`}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold outline-none hover:bg-[#D6E0EA] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
              >
                Full schedule <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-[#8898aa]/25 px-4 sm:px-5">
              {todayBookings.length === 0 ? (
                <AllClear text="No active bookings today." />
              ) : (
                todayBookings.map((booking) => (
                  <TodayBookingRow key={booking.id} booking={booking} />
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6" aria-label="Needs action">
            <section
              aria-labelledby="review-heading"
              className="overflow-hidden rounded-2xl border border-[#8898aa]/30 bg-[#E3EBF3] shadow-raised-sm"
            >
              <div className="border-b border-[#8898aa]/25 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="review-heading" className="text-lg font-semibold">
                    Review today
                  </h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    {reviewTotal}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5B6B7C]">
                  Today only · oldest request first
                </p>
              </div>
              <div className="divide-y divide-[#8898aa]/25 px-4">
                {reviewToday.length === 0 ? (
                  <AllClear text="No bookings need review today." />
                ) : (
                  reviewToday.map((booking) => (
                    <ReviewRow
                      key={booking.id}
                      booking={booking}
                      generatedAt={generatedAt}
                    />
                  ))
                )}
              </div>
              {reviewTotal > reviewToday.length && (
                <div className="border-t border-[#8898aa]/25 p-3">
                  <Link
                    href={`/bookings/date/${businessDate}`}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-xl text-sm font-semibold outline-none hover:bg-[#D6E0EA] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                  >
                    View all {reviewTotal} <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>

            <section
              aria-labelledby="contact-heading"
              className="overflow-hidden rounded-2xl border border-[#8898aa]/30 bg-[#E3EBF3] shadow-raised-sm"
            >
              <div className="border-b border-[#8898aa]/25 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="contact-heading" className="text-lg font-semibold">
                    Upcoming — needs contact
                  </h2>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-900">
                    {contactTotal}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5B6B7C]">
                  Upcoming only · oldest request first
                </p>
              </div>
              <div className="divide-y divide-[#8898aa]/25 px-4">
                {contactUpcoming.length === 0 ? (
                  <AllClear text="No upcoming guests need contact." />
                ) : (
                  contactUpcoming.map((booking) => (
                    <div key={booking.id} className="space-y-3 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <BookingLink id={booking.id} name={booking.name} />
                          <BookingStatusBadge status={booking.bookingStatus} />
                          {booking.bookingStatus === BookingStatus.WAITING_PAYMENT && (
                            <PaymentDeadline
                              expiresAt={booking.paymentExpiresAt?.toISOString() ?? null}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#22303F]">
                          {booking.contactReason}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#5B6B7C]">
                          {shortDateLabel(booking.date)} · {serviceLabel(booking.service)} ·{" "}
                          {lastContactLabel(booking)}
                        </p>
                      </div>
                      <ContactActions
                        bookingId={booking.id}
                        guestName={booking.name}
                        phone={booking.phone}
                        email={booking.email}
                        paymentLink={booking.paymentLink}
                        needsPaymentLink={booking.bookingStatus === BookingStatus.WAITING_PAYMENT}
                      />
                    </div>
                  ))
                )}
              </div>
              {contactTotal > contactUpcoming.length && (
                <div className="border-t border-[#8898aa]/25 p-3">
                  <Link
                    href="/bookings?sort=created&dir=asc"
                    className="flex min-h-10 items-center justify-center gap-1 rounded-xl text-sm font-semibold outline-none hover:bg-[#D6E0EA] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                  >
                    Open upcoming bookings <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>
          </aside>

          <section
            aria-labelledby="capacity-heading"
            className="overflow-hidden rounded-2xl border border-[#8898aa]/30 bg-[#E3EBF3] shadow-raised-sm lg:col-span-2"
          >
            <div className="border-b border-[#8898aa]/25 px-4 py-4 sm:px-5">
              <h2 id="capacity-heading" className="text-lg font-semibold">
                Capacity — next 7 days
              </h2>
              <p className="mt-1 text-xs text-[#5B6B7C]">
                Adults and children in confirmed or arrived bookings
              </p>
            </div>
            <div className="overflow-x-auto px-4 py-4 sm:px-5">
              <div className="flex min-w-max gap-3">
                {capacity.map((day) => {
                  const percent = Math.min(
                    100,
                    Math.round((day.people / DAILY_CAPACITY) * 100),
                  );
                  const nearlyFull = !day.closed && percent >= 80;
                  return (
                    <Link
                      key={day.date}
                      href={`/bookings/date/${day.date}`}
                      className={`flex min-h-24 w-32 shrink-0 flex-col justify-between rounded-xl border p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#0EA5E9] ${
                        day.closed
                          ? "border-red-200 bg-red-50 text-red-900"
                          : nearlyFull
                            ? "border-amber-300 bg-amber-50 text-amber-950"
                            : "border-[#8898aa]/30 bg-[#D6E0EA] text-[#22303F] hover:border-[#8898aa]/60"
                      }`}
                      aria-label={`${shortDateLabel(new Date(`${day.date}T00:00:00.000Z`))}: ${day.people} of ${DAILY_CAPACITY} guests${day.closed ? ", closed" : nearlyFull ? ", nearly full" : ""}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {shortDateLabel(new Date(`${day.date}T00:00:00.000Z`))}
                      </span>
                      <span className="font-[family-name:var(--font-roboto-mono)] text-lg font-semibold tabular-nums">
                        {day.people}/{DAILY_CAPACITY}
                      </span>
                      <span className="text-xs font-medium">
                        {day.closed ? "Closed" : nearlyFull ? "Nearly full" : "Available"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
