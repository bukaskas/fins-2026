import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { BookingStatus } from "@prisma/client";

import { hasCapability } from "@/lib/auth-guard";
import { getBookingForDesk } from "@/lib/actions/booking.actions";
import { buildBookingMessages } from "@/lib/bookings/messages";
import {
  FOCUS_RING,
  MUTED,
  STATUS_BORDER,
  STATUS_LABEL,
  STATUS_TEXT,
  serviceLabel,
} from "@/lib/bookings/status";
import DeskCommandBar from "./DeskCommandBar";
import MessageDeck from "./MessageDeck";
import PaymentPanel from "./PaymentPanel";
import PartyDialog from "./PartyDialog";
import StatusDialog from "@/components/bookings/BookingStatusDialog";
import ContactLog from "./ContactLog";

/*
  DIRECTION — booking desk view

  WORLD    Inherits the bookings warm-paper system: #faf9f7 ground, flat white
           cards, Raleway labels, Roboto Mono tabular figures. No gradient
           ambience — that belongs to the guest's page, this is the tool.
  STRUCTURE Split command bar. A summary band answers "right booking, what do
           they owe" without scrolling; a fixed bottom bar holds the thumb
           actions; everything else scrolls between them.
  SUBSTANCE The middle band leads with the message deck, because the desk's
           most frequent job on one booking is sending that guest the next
           message — not reading a record.
  MOMENT   Every message renders with this booking's real name and amounts, so
           the desk sends rather than composes.
  RISK     Two surfaces now describe one booking; they must never disagree.
           Both read the same server actions and the same status tokens.
*/

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Desk view",
  robots: { index: false, follow: false },
};

export default async function BookingDeskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await hasCapability("bookings:manage"))) {
    redirect(`/bookings/${id}`);
  }

  const booking = await getBookingForDesk(id);
  if (!booking) notFound();

  const date = new Date(booking.date);
  const service = serviceLabel(booking.service);
  const adults = booking.numberOfPeople ?? 0;
  const kids = booking.numberOfKids ?? 0;

  const paid = booking.amountPaidCents ?? 0;
  const total = booking.totalPriceCents ?? 0;
  const balance = Math.max(0, total - paid);

  const messages = buildBookingMessages({
    id: booking.id,
    name: booking.name,
    service: booking.service,
    date,
    time: booking.time,
    bookingStatus: booking.bookingStatus,
    numberOfPeople: adults,
    numberOfKids: kids,
    totalPriceCents: booking.totalPriceCents,
    amountPaidCents: paid,
    paymentLink: booking.paymentLink,
    instagram: booking.instagram,
  });

  const partyLabel = `${adults + kids} ${adults + kids === 1 ? "person" : "people"}`;
  const isClosed =
    booking.bookingStatus === BookingStatus.CANCELED ||
    booking.bookingStatus === BookingStatus.DECLINED ||
    booking.bookingStatus === BookingStatus.NO_RESPONSE_EXPIRED;

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-28 sm:pb-24">
      {/* ── summary band ─────────────────────────────────────────────────
          Not sticky on mobile: the bookings brief forbids pinning a stacked
          toolbar this tall on a phone. It sticks from sm up, where it fits. */}
      <header className="border-b border-[#ece8e3] bg-white sm:sticky sm:top-0 sm:z-30">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/bookings"
              className={`inline-flex min-h-11 min-w-11 items-center gap-2 -ml-2 rounded-full px-2 text-[#3a3531] transition-colors hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <ArrowLeft className="size-4" strokeWidth={1.6} aria-hidden="true" />
              <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.18em]">
                Bookings
              </span>
            </Link>

            <Link
              href={`/bookings/${booking.id}`}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ece8e3] px-3 text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <ExternalLink className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
              <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.14em]">
                Guest page
              </span>
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="truncate font-[family-name:var(--font-raleway)] text-[1.5rem] font-[600] leading-tight tracking-[-0.01em] text-[#1a1614] sm:text-[1.75rem]">
                {booking.name}
              </h1>
              <p
                className="mt-1 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400]"
                style={{ color: MUTED }}
              >
                {service}
                <span className="mx-1.5 text-[#d6d0c8]">·</span>
                <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums">
                  {format(date, "EEE d MMM")}
                </span>
                {booking.time && (
                  <>
                    <span className="mx-1.5 text-[#d6d0c8]">·</span>
                    <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums">
                      {booking.time}
                    </span>
                  </>
                )}
                <span className="mx-1.5 text-[#d6d0c8]">·</span>
                {partyLabel}
              </p>
            </div>

            <div className="flex items-end gap-4">
              <StatusDialog
                bookingId={booking.id}
                status={booking.bookingStatus}
                trigger={
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: `${STATUS_BORDER[booking.bookingStatus]}1f`,
                      color: STATUS_TEXT[booking.bookingStatus],
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: STATUS_BORDER[booking.bookingStatus] }}
                    />
                    <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[700] uppercase tracking-[0.14em]">
                      {STATUS_LABEL[booking.bookingStatus]}
                    </span>
                    <Pencil className="size-3" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                }
              />

              <div className="text-right">
                <div
                  className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.16em] sm:text-[0.62rem]"
                  style={{ color: MUTED }}
                >
                  {balance > 0 ? "Balance due" : "Balance"}
                </div>
                <div className="mt-0.5 font-[family-name:var(--font-roboto-mono)] text-[1.75rem] font-[500] leading-none tabular-nums text-[#1a1614] sm:text-[2rem]">
                  {new Intl.NumberFormat("en-EG").format(Math.round(balance / 100))}
                  <span
                    className="ml-1.5 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400]"
                    style={{ color: MUTED }}
                  >
                    EGP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {isClosed && (
          <div className="mb-6 rounded-2xl border border-[#e5cfcb] bg-[#fbf1ef] px-4 py-3">
            <p className="font-[family-name:var(--font-raleway)] text-[0.86rem] font-[500] text-[#7E2A23]">
              This booking is {STATUS_LABEL[booking.bookingStatus].toLowerCase()}.
            </p>
            <p className="mt-1 font-[family-name:var(--font-raleway)] text-[0.82rem] text-[#7E2A23]/85">
              {booking.bookingStatus === BookingStatus.CANCELED &&
              booking.waitingPaymentAt
                ? "The 24-hour payment window lapsed and the booking was closed automatically. Change the status to re-open it."
                : "Change the status above to re-open it."}
            </p>
          </div>
        )}

        {/* ── the desk's main job: say the next thing to this guest ── */}
        <MessageDeck
          bookingId={booking.id}
          phone={booking.phone}
          email={booking.email}
          instagram={booking.instagram}
          messages={messages}
        />

        <PaymentPanel
          bookingId={booking.id}
          bookingStatus={booking.bookingStatus}
          totalPriceCents={booking.totalPriceCents}
          amountPaidCents={paid}
          paymentLink={booking.paymentLink}
          waitingPaymentAt={booking.waitingPaymentAt?.toISOString() ?? null}
          payments={booking.payments.map((p) => ({
            id: p.id,
            amountCents: p.amountCents,
            method: p.method,
            reference: p.reference,
            createdAt: p.createdAt.toISOString(),
          }))}
        />

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#ece8e3] bg-white p-4 shadow-[0_1px_6px_rgba(26,22,20,0.08)]">
            <h2
              className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
              style={{ color: MUTED }}
            >
              Party
            </h2>
            <div className="mt-3">
              <PartyDialog
                bookingId={booking.id}
                adults={adults}
                kids={kids}
                service={booking.service}
                dateIso={date.toISOString()}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#ece8e3] bg-white p-4 shadow-[0_1px_6px_rgba(26,22,20,0.08)]">
            <h2
              className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
              style={{ color: MUTED }}
            >
              Assignment
            </h2>
            <dl className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <dt
                  className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
                  style={{ color: MUTED }}
                >
                  Instructor
                </dt>
                <dd className="text-right font-[family-name:var(--font-raleway)] text-[0.88rem] text-[#1a1614]">
                  {booking.instructor || (
                    <span style={{ color: MUTED }}>Not assigned</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt
                  className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
                  style={{ color: MUTED }}
                >
                  Handled by
                </dt>
                <dd className="text-right font-[family-name:var(--font-raleway)] text-[0.88rem] text-[#1a1614]">
                  {booking.agent?.name ?? booking.agent?.email ?? (
                    <span style={{ color: MUTED }}>Not assigned</span>
                  )}
                </dd>
              </div>
            </dl>
            <Link
              href={`/bookings/${booking.id}/edit`}
              className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ece8e3] px-4 text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <Pencil className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
              <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.14em]">
                Edit booking
              </span>
            </Link>
          </div>
        </section>

        <ContactLog
          contacts={booking.contacts.map((c) => ({
            id: c.id,
            channel: c.channel,
            outcome: c.outcome,
            createdAt: c.createdAt.toISOString(),
            actor: c.actor?.name ?? c.actor?.email ?? null,
          }))}
          createdAt={booking.createdAt.toISOString()}
        />
      </main>

      <DeskCommandBar
        bookingId={booking.id}
        bookingStatus={booking.bookingStatus}
        guestName={booking.name}
        phone={booking.phone}
        primaryMessage={messages[0]?.body ?? ""}
      />
    </div>
  );
}
