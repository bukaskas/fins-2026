import { Booking, BookingEventSource, BookingGroup, BookingStatus } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { sendBookingEmail } from "@/emails/index";
import { depositDueCents, paymentDeadline } from "@/lib/bookings/payment-window";
import { dateKeyInCairo, utcMidnightFromKey } from "@/lib/date-keys";
import {
  calculateDayUsePrice,
  isSpectatorRate,
  priceFromUnitRates,
  ratesFromSnapshot,
  type PriceBreakdown,
} from "@/lib/pricing";

// Guest emails driven by the payment window. Deliberately not a "use server"
// module: these send mail, so they must not be callable as public actions.

/**
 * Day use prints per-person line items from the rates the booking was sold at
 * (a legacy row without a snapshot falls back to today's rate). If the table
 * would not sum to what the guest is actually charged - e.g. a hand-corrected
 * total - it is dropped instead: the total on the row stays the single source
 * of truth, exactly as at booking time.
 */
export function emailPriceBreakdown(booking: Booking): PriceBreakdown | undefined {
  if (booking.service !== "day-use") return undefined;
  const soldAt = ratesFromSnapshot(booking);
  const recomputed = soldAt
    ? priceFromUnitRates(soldAt, booking.numberOfPeople, booking.numberOfKids)
    : calculateDayUsePrice(booking.date, booking.numberOfPeople, booking.numberOfKids);
  return recomputed.totalCents === booking.totalPriceCents ? recomputed : undefined;
}

/**
 * Corporate rows carry the deposit itself in totalPriceCents and are arranged
 * with the client directly, so the "pay a 50% deposit" emails would be wrong.
 */
function sendsPaymentWindowEmails(booking: Booking): boolean {
  return !!booking.email && booking.service !== "corporate";
}

/**
 * "Pay your deposit to hold <date>": once per payment window. The window is
 * identified by its `waitingPaymentAt`, claimed atomically in the WHERE clause
 * so two concurrent callers can't both send; a restarted window has a new
 * timestamp and gets its own email with the new deadline.
 *
 * Never throws: a mail outage must not fail the status change that started
 * the window.
 */
export async function sendPaymentRequestEmail(bookingId: string) {
  let claimedWindow: Date | null = null;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (
      !booking ||
      !booking.email ||
      !sendsPaymentWindowEmails(booking) ||
      booking.bookingStatus !== BookingStatus.WAITING_PAYMENT ||
      !booking.waitingPaymentAt
    ) {
      return;
    }

    const window = booking.waitingPaymentAt;
    const { count } = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        bookingStatus: BookingStatus.WAITING_PAYMENT,
        waitingPaymentAt: window,
        OR: [
          { paymentRequestEmailWindowAt: null },
          { paymentRequestEmailWindowAt: { not: window } },
        ],
      },
      data: { paymentRequestEmailWindowAt: window },
    });
    if (count === 0) return;
    claimedWindow = window;

    const isDayUse = booking.service === "day-use";
    const total = booking.totalPriceCents;
    const depositDue =
      total !== null
        ? depositDueCents(total, booking.amountPaidCents, isSpectatorRate(booking))
        : undefined;
    const arrival =
      total !== null && depositDue !== undefined
        ? Math.max(total - booking.amountPaidCents - depositDue, 0)
        : undefined;

    await sendBookingEmail(booking.email, booking.name, booking.date, {
      bookingType: booking.service,
      numberOfPeople: isDayUse ? booking.numberOfPeople : undefined,
      numberOfKids: isDayUse ? booking.numberOfKids : undefined,
      priceBreakdown: emailPriceBreakdown(booking),
      bookingId: booking.id,
      spectator: booking.bookingGroup === BookingGroup.SPECTATOR,
      stage: "awaiting-payment",
      depositDueCents: depositDue,
      balanceDueCents: arrival,
      deadline: paymentDeadline(window),
    });
  } catch (error) {
    // Nothing reached the guest, so give the window back for a retry.
    if (claimedWindow) {
      await prisma.booking
        .updateMany({
          where: { id: bookingId, paymentRequestEmailWindowAt: claimedWindow },
          data: { paymentRequestEmailWindowAt: null },
        })
        .catch((e) => console.error("Payment request email release error:", e));
    }
    console.error("Payment request email error:", error);
  }
}

/**
 * Only recent expiries are announced: an email about a hold released days ago,
 * e.g. after a mail outage, would arrive long after it could help.
 */
const RELEASE_EMAIL_LOOKBACK_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * "We released your spot" for every booking the system let lapse unpaid and
 * hasn't told yet. Expiry also runs on staff page loads, which must not send
 * mail, so this runs from the cron route and picks up those rows too.
 * Bookings staff canceled by hand, or reopened since, are left alone: their
 * latest status change must be the cron's. Returns how many were sent.
 */
export async function sendReleasedHoldEmails(): Promise<number> {
  const candidates = await prisma.booking.findMany({
    where: {
      bookingStatus: BookingStatus.CANCELED,
      cancellationEmailSentAt: null,
      email: { not: null },
      // A date that has already gone has nothing left to rebook.
      date: { gte: utcMidnightFromKey(dateKeyInCairo()) },
      events: {
        some: {
          source: BookingEventSource.CRON,
          toStatus: BookingStatus.CANCELED,
          createdAt: { gte: new Date(Date.now() - RELEASE_EMAIL_LOOKBACK_MS) },
        },
      },
    },
    include: {
      events: {
        where: { toStatus: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { source: true },
      },
    },
  });

  let sent = 0;
  for (const booking of candidates) {
    if (booking.events[0]?.source !== BookingEventSource.CRON) continue;
    if (!booking.email || !sendsPaymentWindowEmails(booking)) continue;

    const { count } = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        bookingStatus: BookingStatus.CANCELED,
        cancellationEmailSentAt: null,
      },
      data: { cancellationEmailSentAt: new Date() },
    });
    if (count === 0) continue;

    try {
      const isDayUse = booking.service === "day-use";
      await sendBookingEmail(booking.email, booking.name, booking.date, {
        bookingType: booking.service,
        numberOfPeople: isDayUse ? booking.numberOfPeople : undefined,
        numberOfKids: isDayUse ? booking.numberOfKids : undefined,
        bookingId: booking.id,
        spectator: booking.bookingGroup === BookingGroup.SPECTATOR,
        stage: "cancelled",
        deadline: booking.waitingPaymentAt
          ? paymentDeadline(booking.waitingPaymentAt)
          : undefined,
      });
      sent += 1;
    } catch (error) {
      // Unclaim so the next hourly run tries again, within the lookback.
      await prisma.booking
        .updateMany({
          where: { id: booking.id },
          data: { cancellationEmailSentAt: null },
        })
        .catch((e) => console.error("Released hold email release error:", e));
      console.error("Released hold email error:", error);
    }
  }
  return sent;
}
