import "server-only";

import { BookingEventSource, BookingGroup, BookingStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { sendBookingEmail } from "@/emails/index";
import { CAPACITY_STATUSES } from "@/lib/bookings/capacity";
import {
  emailPriceBreakdown,
  sendFullDatePaymentEmail,
  sendPaymentRequestEmail,
} from "@/lib/bookings/guest-emails";
import { dueAtOnFullDate } from "@/lib/bookings/payment-window";
import { upsertClosedDate } from "@/lib/closed-dates";
import { DAILY_CAPACITY } from "@/lib/constants";

import type { Effect } from "./plan";

/*
 * The follow-on work of a booking status move. Each function is safe to run
 * again (guarded by its own claim column or an `IS NULL` condition) and none
 * of them throws: they run after the move has committed, so a failure here
 * must not undo or fail it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Booking dates and closed dates are stored as UTC midnights.
function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Append to the booking history (see `BookingEvent`). Never throws: the history
 * only feeds reporting, so a failed insert must not undo or fail the change it
 * describes. Call it after the write has committed, not inside a transaction.
 */
export async function logBookingEvents(events: Prisma.BookingEventCreateManyInput[]) {
  if (events.length === 0) return;
  try {
    await prisma.bookingEvent.createMany({ data: events });
  } catch (error) {
    console.error("Booking event log error:", error);
  }
}

export async function isDateAtCapacity(date: Date): Promise<boolean> {
  const dayStart = utcDayStart(date);
  const { _sum } = await prisma.booking.aggregate({
    where: {
      date: { gte: dayStart, lt: new Date(dayStart.getTime() + DAY_MS) },
      bookingStatus: { in: CAPACITY_STATUSES },
    },
    _sum: { numberOfPeople: true, numberOfKids: true },
  });
  return (_sum.numberOfPeople ?? 0) + (_sum.numberOfKids ?? 0) >= DAILY_CAPACITY;
}

/**
 * Pull this payment window's deadline in to the full-date limit, once per
 * window. Returns whether this call applied it, so exactly one caller emails.
 */
export async function cutDeadlineForFullDate(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { date: true, bookingStatus: true, waitingPaymentAt: true, paymentDueAt: true, dateFullNoticeAt: true },
  });
  if (
    !booking ||
    booking.bookingStatus !== BookingStatus.WAITING_PAYMENT ||
    booking.dateFullNoticeAt
  ) {
    return false;
  }
  const now = new Date();
  const { count } = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      bookingStatus: BookingStatus.WAITING_PAYMENT,
      waitingPaymentAt: booking.waitingPaymentAt,
      paymentDueAt: booking.paymentDueAt,
      dateFullNoticeAt: null,
    },
    data: {
      paymentDueAt: dueAtOnFullDate(now, booking.date, booking.paymentDueAt),
      dateFullNoticeAt: now,
    },
  });
  return count === 1;
}

/**
 * A place was taken on `date`. At capacity: close the date, then give
 * everyone still holding an unpaid place 12h to pay. Paying on time still
 * confirms, over capacity.
 */
export async function closeDateIfFull(date: Date) {
  if (!(await isDateAtCapacity(date))) return;
  const dayStart = utcDayStart(date);
  await upsertClosedDate(dayStart, `Auto-closed: ${DAILY_CAPACITY}-person daily capacity reached`);
  const waiting = await prisma.booking.findMany({
    where: {
      date: { gte: dayStart, lt: new Date(dayStart.getTime() + DAY_MS) },
      bookingStatus: BookingStatus.WAITING_PAYMENT,
      dateFullNoticeAt: null,
    },
    select: { id: true },
  });
  for (const { id } of waiting) {
    if (await cutDeadlineForFullDate(id)) await sendFullDatePaymentEmail(id);
  }
}

/**
 * Send the guest their payment confirmation, at most once per booking.
 *
 * `confirmationEmailSentAt` is claimed inside the WHERE clause, so the check
 * and the claim are one atomic statement: a redelivered Flash webhook, a
 * second staff payment, or a booking whose creation email already said
 * "confirmed" (Kai, Kite) never sends a second one.
 */
export async function sendBookingConfirmedEmailOnce(bookingId: string) {
  let claimed = false;
  try {
    const { count } = await prisma.booking.updateMany({
      where: { id: bookingId, confirmationEmailSentAt: null },
      data: { confirmationEmailSentAt: new Date() },
    });
    if (count === 0) return;
    claimed = true;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    // Reception can enter a booking with a phone number and no email, and the
    // Pharaoh template is a one-off event mail with no confirmed variant.
    if (!booking?.email || booking.service === "pharaoh-airstyle") {
      await releaseConfirmationEmailClaim(bookingId);
      return;
    }

    const isDayUse = booking.service === "day-use";
    const totalCents = booking.totalPriceCents;
    await sendBookingEmail(booking.email, booking.name, booking.date, {
      bookingType: booking.service,
      numberOfPeople: isDayUse ? booking.numberOfPeople : undefined,
      numberOfKids: isDayUse ? booking.numberOfKids : undefined,
      priceBreakdown: emailPriceBreakdown(booking),
      bookingId: booking.id,
      spectator: booking.bookingGroup === BookingGroup.SPECTATOR,
      stage: "confirmed",
      amountPaidCents: booking.amountPaidCents,
      balanceDueCents:
        totalCents !== null ? Math.max(totalCents - booking.amountPaidCents, 0) : undefined,
    });
  } catch (error) {
    // The claim means "the guest has this email". Nothing was sent, so give it
    // back and let the next payment - or a manual resend - try again.
    if (claimed) await releaseConfirmationEmailClaim(bookingId);
    console.error("Confirmation email error:", error);
  }
}

async function releaseConfirmationEmailClaim(bookingId: string) {
  try {
    await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { confirmationEmailSentAt: null },
    });
  } catch (error) {
    console.error("Confirmation email claim release error:", error);
  }
}

/**
 * A payment confirmed this booking, so no person did. If it has no owner, it
 * goes to the staff member who last sent it to WAITING_PAYMENT; a booking no
 * staff member moved stays ownerless and is reported as self-serve.
 */
export async function assignPaymentConfirmedOwner(bookingId: string) {
  const request = await prisma.bookingEvent.findFirst({
    where: {
      bookingId,
      source: BookingEventSource.STAFF,
      toStatus: BookingStatus.WAITING_PAYMENT,
      actorId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: { actorId: true },
  });
  if (!request?.actorId) return;
  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, agentId: null },
    data: { agentId: request.actorId },
  });
  if (count > 0) {
    await logBookingEvents([
      { bookingId, source: BookingEventSource.PAYMENT, toAgentId: request.actorId },
    ]);
  }
}

/** Run a plan's effects in order. Each is isolated, so one failure never skips the next. */
export async function runEffects(bookingId: string, date: Date, effects: Effect[]) {
  for (const effect of effects) {
    try {
      switch (effect) {
        case "assignPaymentRequester":
          await assignPaymentConfirmedOwner(bookingId);
          break;
        case "cutDeadlineIfDateFull":
          if (await isDateAtCapacity(date)) await cutDeadlineForFullDate(bookingId);
          break;
        case "sendPaymentRequest":
          await sendPaymentRequestEmail(bookingId);
          break;
        case "closeDateIfFull":
          await closeDateIfFull(date);
          break;
        case "sendConfirmation":
          await sendBookingConfirmedEmailOnce(bookingId);
          break;
      }
    } catch (error) {
      console.error(`Booking effect "${effect}" failed for ${bookingId}:`, error);
    }
  }
}
