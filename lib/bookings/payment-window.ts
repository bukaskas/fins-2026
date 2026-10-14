import {
  FULL_DATE_PAYMENT_WINDOW_MS,
  WAITING_PAYMENT_WINDOW_MS,
} from "@/lib/constants";
import {
  BUSINESS_TIME_ZONE,
  addDaysToKey,
  cairoDayStart,
  dateKeyFromUtcMidnight,
} from "@/lib/date-keys";

/**
 * The online payment is a 50% deposit; the rest is settled at reception. A
 * spectator pass (`paysInFull`) is a ticket, so it is paid in full online.
 */
export function depositCents(totalPriceCents: number, paysInFull = false): number {
  return paysInFull ? totalPriceCents : Math.round(totalPriceCents / 2);
}

/** What the guest still has to pay online to hold the booking. */
export function depositDueCents(
  totalPriceCents: number,
  amountPaidCents: number,
  paysInFull = false,
): number {
  return Math.max(depositCents(totalPriceCents, paysInFull) - amountPaidCents, 0);
}

/*
 * The payment deadline (`Booking.paymentDueAt`). Entering WAITING_PAYMENT
 * starts no clock: the guest's own "Generate payment link" does, and a booking
 * nobody generates a link for simply expires once its date has passed. Once
 * set, a deadline only ever moves earlier inside one payment window, so
 * re-pressing the button, re-issuing a voided link or a later rule can never
 * hand out extra time. It never runs past the booking day: paying on the
 * morning of arrival is fine, paying after the day is over is not.
 */

/** The instant the booking's day is over in Cairo (next day's midnight). */
export function bookingDayEnd(bookingDate: Date): Date {
  return cairoDayStart(addDaysToKey(dateKeyFromUtcMidnight(bookingDate), 1));
}

function earliest(...dates: (Date | null | undefined)[]): Date {
  const times = dates.filter((d): d is Date => !!d).map((d) => d.getTime());
  return new Date(Math.min(...times));
}

/**
 * The deadline once a link exists: an existing one stands, otherwise 24h from
 * the guest's first link, cut at the end of the booking day.
 */
export function dueAtForLink(
  now: Date,
  bookingDate: Date,
  currentDueAt: Date | null,
): Date {
  if (currentDueAt) return currentDueAt;
  return earliest(
    new Date(now.getTime() + WAITING_PAYMENT_WINDOW_MS),
    bookingDayEnd(bookingDate),
  );
}

/**
 * The deadline once the date is fully booked: at most 12h from now, never
 * later than the one the guest already has, never past the booking day.
 */
export function dueAtOnFullDate(
  now: Date,
  bookingDate: Date,
  currentDueAt: Date | null,
): Date {
  return earliest(
    currentDueAt,
    new Date(now.getTime() + FULL_DATE_PAYMENT_WINDOW_MS),
    bookingDayEnd(bookingDate),
  );
}

function cairoParts(instant: Date, style: "long" | "short") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: style,
    day: "numeric",
    month: style,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** "Tuesday 6 October, 14:30 (Cairo time)": an email can sit in an inbox, so
 * the deadline is a fixed wall-clock time, never "within 24 hours". */
export function formatPaymentDeadline(deadline: Date): string {
  const p = cairoParts(deadline, "long");
  return `${p.weekday} ${p.day} ${p.month}, ${p.hour}:${p.minute} (Cairo time)`;
}

/** "Tue 6 Oct, 14:30", for the inbox preview line. */
export function formatPaymentDeadlineShort(deadline: Date): string {
  const p = cairoParts(deadline, "short");
  return `${p.weekday} ${p.day} ${p.month}, ${p.hour}:${p.minute}`;
}
