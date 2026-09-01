import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getServerSession } from "next-auth/next";
import { ArrowUpRight, Clock3, MapPin, SlidersHorizontal } from "lucide-react";
import { BookingStatus, Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { LOCATION_ADDRESS, VISIT_WORKING_HOURS } from "@/lib/constants";
import { getBookingById } from "@/lib/actions/booking.actions";
import { buildMetadata } from "@/lib/metadata";
import { FOCUS_RING, MUTED, serviceLabel } from "@/lib/bookings/status";
import NextStepCard from "./NextStepCard";

/**
 * The guest's booking page — the private link reception sends over WhatsApp.
 *
 * This surface has exactly one audience. Staff controls used to live here
 * behind `isStaff` branches, which meant staff read second-person guest copy
 * about themselves and the guest's checkout button outshouted the desk's own
 * actions. Those moved to ./desk. The only staff affordance left is a quiet
 * link across to it, so reception can still turn the screen around and show a
 * guest exactly what the guest sees.
 */

const STATUS_TONE: Record<
  BookingStatus,
  { label: string; bg: string; ring: string; text: string; dot: string }
> = {
  PENDING:             { label: "Pending",         bg: "#FFF4E0", ring: "#F2D9A6", text: "#7A5414", dot: "#E8A23E" },
  REQUEST_SENT:        { label: "Request sent",    bg: "#E4F1FA", ring: "#BCD8EA", text: "#1E4F72", dot: "#5BA6D6" },
  UNDER_REVIEW:        { label: "Under review",    bg: "#FCE6D5", ring: "#F1C9AA", text: "#7A3E18", dot: "#E68A4D" },
  WAITING_PAYMENT:     { label: "Waiting payment", bg: "#EDE6F8", ring: "#D4C5EE", text: "#4B348A", dot: "#9C82DC" },
  CONFIRMED:           { label: "Confirmed",       bg: "#E2F0E6", ring: "#BFDDC8", text: "#1F5B36", dot: "#62B07F" },
  ARRIVED:             { label: "Arrived",         bg: "#DDEFEE", ring: "#B6D9D6", text: "#16554F", dot: "#4FAEA6" },
  DECLINED:            { label: "Declined",        bg: "#FBE3E1", ring: "#F1C0BB", text: "#7E2A23", dot: "#D86158" },
  NO_RESPONSE_EXPIRED: { label: "No response",     bg: "#EFEEEC", ring: "#D9D6D1", text: "#4B4640", dot: "#9C9690" },
  CANCELED:            { label: "Canceled",        bg: "#F2F1EE", ring: "#DCD9D3", text: "#615C55", dot: "#A8A39B" },
};

function fmtEGP(cents: number): string {
  return new Intl.NumberFormat("en-EG").format(Math.round(cents / 100));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) return { title: "Booking" };

  const service = serviceLabel(booking.service);

  return {
    ...buildMetadata({
      title: `${service} booking · ${booking.name}`,
      description: `Your ${service.toLowerCase()} reservation at Fins.`,
      path: `/bookings/${booking.id}`,
    }),
    // Private per-booking link — keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, session] = await Promise.all([
    getBookingById(id),
    getServerSession(authOptions),
  ]);

  if (!booking) notFound();

  const role = (session?.user as { role?: Role } | undefined)?.role;
  const canManage = roleHasCapability(role, "bookings:manage");

  const status = STATUS_TONE[booking.bookingStatus];
  const service = serviceLabel(booking.service);

  const date = new Date(booking.date);
  const dayName = format(date, "EEEE");
  const dayNum = format(date, "d");
  const monthYear = format(date, "MMMM yyyy");

  const adults = booking.numberOfPeople ?? 0;
  const kids = booking.numberOfKids ?? 0;
  const totalPeople = adults + kids;

  const paid = booking.amountPaidCents ?? 0;
  const total = booking.totalPriceCents ?? 0;
  const paidPct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const balance = Math.max(0, total - paid);

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* soft beach ambience: layered pastel gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, #E4F1FA 0%, transparent 60%), radial-gradient(50rem 38rem at -10% 110%, #FFE4D6 0%, transparent 55%), radial-gradient(40rem 30rem at 50% 50%, #FAF4E8 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-20 sm:px-6 sm:pt-10">
        {/* top utility bar */}
        <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
          {canManage ? (
            <Link
              href={`/bookings/${booking.id}/desk`}
              className={`group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ece8e3] bg-white/70 px-4 py-2 text-[#3a3531] backdrop-blur-sm transition-colors hover:border-[#d6d0c8] hover:bg-white ${FOCUS_RING}`}
            >
              <SlidersHorizontal className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
              <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.18em]">
                Desk view
              </span>
            </Link>
          ) : (
            <span />
          )}

          <span
            className="font-[family-name:var(--font-roboto-mono)] text-[0.72rem] uppercase tracking-[0.12em] sm:text-[0.68rem]"
            style={{ color: MUTED }}
          >
            #{booking.id.slice(0, 8)}
          </span>
        </div>

        {/* hero: the guest's own reservation, their name as the headline */}
        <header className="mb-8">
          <div className="flex flex-wrap-reverse items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h1
                className="font-[family-name:var(--font-raleway)] font-[300] leading-[1.04] tracking-[-0.015em] text-[#1a1614]"
                style={{ fontSize: "clamp(2.1rem, 7vw, 3.25rem)" }}
              >
                {booking.name}
              </h1>
            </div>

            {/* status + compact date card */}
            <div className="flex shrink-0 flex-col items-end gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
                style={{
                  background: status.bg,
                  borderColor: status.ring,
                  color: status.text,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: status.dot,
                    boxShadow: `0 0 0 3px ${status.bg}, 0 0 0 4px ${status.dot}30`,
                  }}
                />
                <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[700] uppercase tracking-[0.2em] sm:text-[0.65rem]">
                  {status.label}
                </span>
              </div>

              <div className="text-right">
                <div
                  className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.18em] sm:text-[0.68rem]"
                  style={{ color: MUTED }}
                >
                  {dayName}
                </div>
                <div className="mt-0.5 flex items-baseline justify-end gap-1.5">
                  <span className="font-[family-name:var(--font-raleway)] text-[2.1rem] font-[300] leading-none tracking-[-0.03em] text-[#1a1614]">
                    {dayNum}
                  </span>
                  <span className="font-[family-name:var(--font-raleway)] text-[0.85rem] font-[400] tracking-[0.02em] text-[#3a3531]">
                    {monthYear}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-2 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#3a3531]">
                  <span>{service}</span>
                  {booking.time && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-[#d6d0c8]" />
                      <span className="font-[family-name:var(--font-roboto-mono)] text-[0.75rem] tabular-nums tracking-[0.04em]">
                        {booking.time}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {booking.bookingStatus === BookingStatus.CONFIRMED && (
          <section
            aria-label="Visit information"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ece8e3] bg-white/70 px-4 py-4 shadow-[0_8px_24px_-16px_rgba(40,32,24,0.22)] backdrop-blur-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF4E0] text-[#7A5414]">
                <Clock3 className="size-4" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span
                  className="block font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.6rem]"
                  style={{ color: MUTED }}
                >
                  Working time
                </span>
                <span className="mt-1 block font-[family-name:var(--font-roboto-mono)] text-[0.8rem] tracking-[0.01em] text-[#1a1614] sm:text-[0.86rem]">
                  {VISIT_WORKING_HOURS}
                </span>
              </span>
            </div>

            <a
              href={LOCATION_ADDRESS}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex min-w-0 items-center gap-3 rounded-2xl border border-[#ece8e3] bg-white/70 px-4 py-4 shadow-[0_8px_24px_-16px_rgba(40,32,24,0.22)] backdrop-blur-sm transition-colors hover:border-[#d6d0c8] hover:bg-white ${FOCUS_RING}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E4F1FA] text-[#1E4F72]">
                <MapPin className="size-4" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.6rem]"
                  style={{ color: MUTED }}
                >
                  Location
                </span>
                <span className="mt-1 block font-[family-name:var(--font-raleway)] text-[0.8rem] font-[500] text-[#1a1614] sm:text-[0.86rem]">
                  Open in Google Maps
                </span>
              </span>
              <ArrowUpRight
                className="size-3.5 shrink-0 text-[#6b6460] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </a>
          </section>
        )}

        {/* next step — conditional on status */}
        <NextStepCard
          status={booking.bookingStatus}
          totalPriceCents={total}
          amountPaidCents={paid}
          bookingId={booking.id}
          paymentLink={booking.paymentLink}
          paymentLinkExpiresAt={booking.paymentLinkExpiresAt}
          waitingPaymentAt={booking.waitingPaymentAt}
        />

        {/* hairline */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-[#ece8e3] to-transparent" />

        <section className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2">
          {/* party */}
          <div>
            <SectionLabel>Party</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-raleway)] text-[2.5rem] font-[300] leading-none tracking-[-0.03em] text-[#1a1614] sm:text-[3.5rem]">
                {totalPeople}
              </span>
              <span
                className="font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400]"
                style={{ color: MUTED }}
              >
                {totalPeople === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="mt-3 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400] text-[#3a3531]">
              {adults} {adults === 1 ? "adult" : "adults"}
              {kids > 0 && (
                <>
                  <span className="mx-1.5 text-[#d6d0c8]">·</span>
                  {kids} {kids === 1 ? "kid" : "kids"}
                </>
              )}
            </div>
          </div>

          {/* deposit */}
          <div className="min-w-0">
            <SectionLabel>Deposit paid</SectionLabel>
            <div className="flex min-w-0 flex-wrap items-baseline gap-2">
              <span className="font-[family-name:var(--font-raleway)] text-[2.5rem] font-[300] leading-none tracking-[-0.03em] tabular-nums text-[#1a1614] sm:text-[3.5rem]">
                {fmtEGP(paid)}
              </span>
              <span
                className="font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400]"
                style={{ color: MUTED }}
              >
                EGP
              </span>
            </div>

            {total > 0 ? (
              <>
                <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-[#ece8e3]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${paidPct}%`,
                      background:
                        paidPct >= 100
                          ? "linear-gradient(90deg, #62B07F, #4FAEA6)"
                          : "linear-gradient(90deg, #5BA6D6, #9C82DC)",
                    }}
                  />
                </div>
                <div
                  className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-[family-name:var(--font-raleway)] text-[0.78rem]"
                  style={{ color: MUTED }}
                >
                  <span>
                    of{" "}
                    <span className="font-[family-name:var(--font-roboto-mono)] text-[0.75rem] tabular-nums text-[#3a3531]">
                      {fmtEGP(total)} EGP
                    </span>
                  </span>
                  <span>
                    {paidPct >= 100 ? (
                      <span className="text-[0.72rem] font-[600] uppercase tracking-[0.06em] text-[#15803d]">
                        Settled
                      </span>
                    ) : (
                      <>
                        <span className="font-[family-name:var(--font-roboto-mono)] text-[0.75rem] tabular-nums text-[#3a3531]">
                          {fmtEGP(balance)} EGP
                        </span>{" "}
                        remaining
                      </>
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div
                className="mt-3 font-[family-name:var(--font-raleway)] text-[0.82rem]"
                style={{ color: MUTED }}
              >
                Total price not set
              </div>
            )}
          </div>

          {/* assignment (only if relevant) */}
          {(booking.agent || booking.instructor) && (
            <div className="grid grid-cols-1 gap-8 border-t border-[#ece8e3] pt-6 sm:col-span-2 sm:grid-cols-2">
              {booking.instructor && (
                <div>
                  <SectionLabel>Instructor</SectionLabel>
                  <p className="font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] text-[#1a1614]">
                    {booking.instructor}
                  </p>
                </div>
              )}
              {booking.agent && (
                <div>
                  <SectionLabel>Handled by</SectionLabel>
                  <p className="font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] text-[#1a1614]">
                    {booking.agent.name ?? booking.agent.email}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* footer mono detail */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-[#ece8e3]" />
          <span
            className="font-[family-name:var(--font-roboto-mono)] text-[0.72rem] uppercase tracking-[0.2em] sm:text-[0.68rem]"
            style={{ color: MUTED }}
          >
            Booked {format(new Date(booking.createdAt), "d MMM yyyy")}
          </span>
          <span className="h-px w-8 bg-[#ece8e3]" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-3 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.22em] sm:text-[0.62rem]"
      style={{ color: MUTED }}
    >
      {children}
    </div>
  );
}
