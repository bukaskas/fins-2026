import { WAITING_PAYMENT_WINDOW_MS } from "@/lib/constants";
import { BUSINESS_TIME_ZONE } from "@/lib/date-keys";

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

/** When an unpaid WAITING_PAYMENT booking is released. */
export function paymentDeadline(waitingPaymentAt: Date): Date {
  return new Date(waitingPaymentAt.getTime() + WAITING_PAYMENT_WINDOW_MS);
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
