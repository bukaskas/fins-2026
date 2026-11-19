import { BookingEventSource, BookingStatus } from "@prisma/client";

import { CONFIRMED_STATUSES } from "@/lib/bookings/agent-stats";
import { CAPACITY_STATUSES } from "@/lib/bookings/capacity";
import { bookingDayEnd } from "@/lib/bookings/payment-window";

import { canMove } from "./transitions";

/** What the planner needs to know about the booking before the move. */
export type LifecycleSnapshot = {
  /** `null` while the booking is being created. */
  bookingStatus: BookingStatus | null;
  date: Date;
  agentId: string | null;
  paymentLinkExpiresAt: Date | null;
};

export type PlanContext = {
  source: BookingEventSource;
  /** The staff member making the move; absent for guests, payments and cron. */
  actorId?: string | null;
  /** "payment": a recorded payment caused this move (staff or Flash). */
  cause?: "move" | "payment";
  now: Date;
};

/**
 * Follow-on work, run after the write commits, in list order. Each one is
 * idempotent or guarded by its own claim column, and none may throw.
 */
export type Effect =
  /** Flash confirmed an unowned booking: give it to whoever last requested payment. */
  | "assignPaymentRequester"
  /** The date may already be full: shorten this window's deadline (dateFullNoticeAt). */
  | "cutDeadlineIfDateFull"
  /** "Pay your deposit" email, once per window (paymentRequestEmailWindowAt). */
  | "sendPaymentRequest"
  /** A place was taken: close the date at capacity and hurry everyone still waiting. */
  | "closeDateIfFull"
  /** "You're confirmed" email, once per booking (confirmationEmailSentAt). */
  | "sendConfirmation";

/** Lifecycle columns the move writes, in the same statement as the status. */
export type LifecyclePatch = {
  bookingStatus?: BookingStatus;
  waitingPaymentAt?: Date;
  paymentDueAt?: null;
  dateFullNoticeAt?: null;
  cancellationEmailSentAt?: null;
  paymentLinkExpiresAt?: Date;
};

export type EventDraft = {
  source: BookingEventSource;
  actorId: string | null;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  toAgentId?: string;
};

export type TransitionPlan = {
  from: BookingStatus | null;
  to: BookingStatus;
  /** False when there is nothing to write: the booking is already there. */
  changed: boolean;
  /** The write only applies while the booking is still in this status. */
  guard: { bookingStatus: BookingStatus | null };
  patch: LifecyclePatch;
  /** Set `agentId` to this, but only while the booking is still unowned. */
  ownerClaim: string | null;
  event: EventDraft | null;
  effects: Effect[];
};

export type RefusalReason = "not_allowed" | "date_passed";

export type PlanResult =
  | { ok: true; plan: TransitionPlan }
  | { ok: false; reason: RefusalReason };

export const REFUSAL_MESSAGE: Record<RefusalReason, string> = {
  not_allowed: "That status change isn't allowed from the booking's current status.",
  date_passed: "This booking's date has passed. Move it to a new date first.",
};

const enters = (set: readonly BookingStatus[], from: BookingStatus | null, to: BookingStatus) =>
  set.includes(to) && !(from !== null && set.includes(from));

/**
 * Work out everything a status move means, without touching anything.
 *
 * - Entering WAITING_PAYMENT (including re-entering it) opens a fresh payment
 *   window: no deadline until the guest's first link, any live link voided.
 *   Refused once the booking day is over, since the guest could not pay.
 * - Entering a confirmed status from outside one gives an unowned booking to
 *   the staff member making the move; a Flash payment instead hands it to
 *   whoever last requested payment.
 * - Taking a place (CONFIRMED or ARRIVED, from outside those) checks capacity.
 * - The confirmation email goes out only when a payment caused the move: never
 *   for a staff status change or a booking created CONFIRMED.
 */
export function planTransition(
  snapshot: LifecycleSnapshot,
  to: BookingStatus,
  ctx: PlanContext,
): PlanResult {
  const from = snapshot.bookingStatus;
  const byPayment = ctx.cause === "payment";
  const guard = { bookingStatus: from };

  if (from === to && to !== BookingStatus.WAITING_PAYMENT) {
    return {
      ok: true,
      plan: {
        from,
        to,
        changed: false,
        guard,
        patch: {},
        ownerClaim: null,
        event: null,
        effects: byPayment && to === BookingStatus.CONFIRMED ? ["sendConfirmation"] : [],
      },
    };
  }

  if (!canMove(from, to)) return { ok: false, reason: "not_allowed" };

  const opensWindow = to === BookingStatus.WAITING_PAYMENT;
  if (opensWindow && bookingDayEnd(snapshot.date).getTime() <= ctx.now.getTime()) {
    return { ok: false, reason: "date_passed" };
  }

  const actorId = ctx.actorId ?? null;
  const patch: LifecyclePatch = { bookingStatus: to };
  const effects: Effect[] = [];

  if (opensWindow) {
    patch.waitingPaymentAt = ctx.now;
    patch.paymentDueAt = null;
    patch.dateFullNoticeAt = null;
    // A new hold: if this one lapses too, the guest hears about it again.
    patch.cancellationEmailSentAt = null;
    if (snapshot.paymentLinkExpiresAt && snapshot.paymentLinkExpiresAt > ctx.now) {
      patch.paymentLinkExpiresAt = ctx.now;
    }
    effects.push("cutDeadlineIfDateFull", "sendPaymentRequest");
  }

  const entersConfirmed = enters(CONFIRMED_STATUSES, from, to);
  const unowned = snapshot.agentId === null;
  const ownerClaim = entersConfirmed && unowned && actorId ? actorId : null;

  if (entersConfirmed && unowned && byPayment && ctx.source === BookingEventSource.PAYMENT) {
    effects.push("assignPaymentRequester");
  }
  if (enters(CAPACITY_STATUSES, from, to)) effects.push("closeDateIfFull");
  if (byPayment && to === BookingStatus.CONFIRMED) effects.push("sendConfirmation");

  return {
    ok: true,
    plan: {
      from,
      to,
      changed: true,
      guard,
      patch,
      ownerClaim,
      event: {
        source: ctx.source,
        actorId,
        fromStatus: from,
        toStatus: to,
        ...(ownerClaim ? { toAgentId: ownerClaim } : {}),
      },
      effects,
    },
  };
}
