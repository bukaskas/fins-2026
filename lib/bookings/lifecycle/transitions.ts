import { BookingStatus } from "@prisma/client";

const {
  PENDING,
  CONTACTED,
  UNDER_REVIEW,
  WAITING_PAYMENT,
  CONFIRMED,
  ARRIVED,
  DECLINED,
  NO_RESPONSE_EXPIRED,
  CANCELED,
  EXPIRED,
} = BookingStatus;

/**
 * Every status move a booking may make, for every kind of actor alike: staff,
 * guests, payments and the cron all follow this one table.
 *
 * - `NEW` is a booking being created.
 * - WAITING_PAYMENT → WAITING_PAYMENT is a real move: it restarts the payment
 *   window, voids the old link and emails the guest again.
 * - CANCELED and EXPIRED reopen to WAITING_PAYMENT so the guest can pay, or go
 *   straight to CONFIRMED when staff record a payment (see `paymentTarget`).
 *   Opening a window also needs the booking day not to be over; that check
 *   lives in the planner, since it depends on the date, not the status.
 * - Every status can go to UNDER_REVIEW: money can arrive at any time (a
 *   late link payment after the hold was released, a second charge after the
 *   booking settled), and a booking holding unexplained money must land in
 *   front of a human rather than stay closed.
 * - DECLINED and NO_RESPONSE_EXPIRED reopen to nothing else.
 *
 * A same-status move other than WAITING_PAYMENT is never listed: the planner
 * treats it as "nothing to do", not as a move.
 */
export const ALLOWED: Readonly<Record<BookingStatus | "NEW", readonly BookingStatus[]>> = {
  NEW: [PENDING, WAITING_PAYMENT, CONFIRMED, ARRIVED],
  PENDING: [CONTACTED, UNDER_REVIEW, WAITING_PAYMENT, CONFIRMED, DECLINED, NO_RESPONSE_EXPIRED, CANCELED, EXPIRED],
  CONTACTED: [UNDER_REVIEW, WAITING_PAYMENT, CONFIRMED, DECLINED, NO_RESPONSE_EXPIRED, CANCELED, EXPIRED],
  UNDER_REVIEW: [WAITING_PAYMENT, CONFIRMED, DECLINED, CANCELED, EXPIRED],
  WAITING_PAYMENT: [WAITING_PAYMENT, UNDER_REVIEW, CONFIRMED, DECLINED, NO_RESPONSE_EXPIRED, CANCELED, EXPIRED],
  CONFIRMED: [ARRIVED, UNDER_REVIEW, WAITING_PAYMENT, CANCELED],
  ARRIVED: [UNDER_REVIEW, CONFIRMED],
  CANCELED: [WAITING_PAYMENT, CONFIRMED, UNDER_REVIEW],
  EXPIRED: [WAITING_PAYMENT, CONFIRMED, UNDER_REVIEW],
  DECLINED: [UNDER_REVIEW],
  NO_RESPONSE_EXPIRED: [UNDER_REVIEW],
};

/** Where a booking in `from` may move. `null` is a booking being created. */
export function allowedTargets(from: BookingStatus | null): readonly BookingStatus[] {
  return ALLOWED[from ?? "NEW"];
}

export function canMove(from: BookingStatus | null, to: BookingStatus): boolean {
  return allowedTargets(from).includes(to);
}

/** Statuses a staff-recorded payment confirms, whatever the amount. */
const CONFIRMED_BY_STAFF_PAYMENT: readonly BookingStatus[] = [
  PENDING,
  CONTACTED,
  UNDER_REVIEW,
  WAITING_PAYMENT,
  CANCELED,
  EXPIRED,
  CONFIRMED,
];

/**
 * The status a staff-recorded payment moves the booking to, or `null` when the
 * money is recorded and the status stays: an arrived guest paying their
 * balance stays ARRIVED, and a declined booking is not revived by money.
 * CONFIRMED → CONFIRMED is "nothing to move", but the payment still sends the
 * once-only confirmation email.
 *
 * Flash settlements do not use this: their own amount and order checks decide
 * between CONFIRMED and UNDER_REVIEW.
 */
export function paymentTarget(from: BookingStatus): BookingStatus | null {
  return CONFIRMED_BY_STAFF_PAYMENT.includes(from) ? CONFIRMED : null;
}
