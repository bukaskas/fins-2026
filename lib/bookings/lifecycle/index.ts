import "server-only";

import { revalidatePath } from "next/cache";
import { BookingEventSource, BookingStatus, Prisma, type Booking } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { ACTIVE_PENDING_STATUSES } from "@/lib/bookings/agent-stats";
import { dateKeyInCairo, utcMidnightFromKey } from "@/lib/date-keys";

import { logBookingEvents, runEffects } from "./effects";
import {
  planTransition,
  REFUSAL_MESSAGE,
  type PlanContext,
  type RefusalReason,
  type TransitionPlan,
} from "./plan";
import { paymentTarget } from "./transitions";

/*
 * The booking lifecycle: the only code that writes `bookingStatus` and the
 * lifecycle columns that travel with it. Server-only, and deliberately not a
 * "use server" file, so none of it is a public endpoint; the server actions
 * check the caller's capability and then call in here.
 *
 * Rules live in ./transitions.ts (which moves are allowed) and ./plan.ts (what
 * each move means). This file loads the booking, applies the plan as one
 * guarded write, and runs the follow-on effects after the write commits.
 */

export type MoveResult =
  | { success: true; moved: boolean; from: BookingStatus | null; to: BookingStatus }
  | { success: false; reason: RefusalReason | "not_found" | "stale"; message: string };

type Db = Prisma.TransactionClient;

type Pending = { bookingId: string; date: Date; plan: TransitionPlan };

const FAILURE_MESSAGE = {
  ...REFUSAL_MESSAGE,
  not_found: "Booking not found.",
  stale: "The booking changed while you were updating it. Refresh and try again.",
} as const;

const fail = (reason: keyof typeof FAILURE_MESSAGE): MoveResult => ({
  success: false,
  reason,
  message: FAILURE_MESSAGE[reason],
});

/**
 * Plan and write one move. `resolveTo` picks the destination from the current
 * status; `null` means "nothing to move" and succeeds with `moved: false`.
 * Returns the effects still to run, which the caller settles after commit.
 */
async function stage(
  db: Db,
  id: string,
  resolveTo: (from: BookingStatus) => BookingStatus | null,
  ctx: PlanContext,
): Promise<{ result: MoveResult; pending: Pending | null }> {
  const before = await db.booking.findUnique({
    where: { id },
    select: { bookingStatus: true, date: true, agentId: true, paymentLinkExpiresAt: true },
  });
  if (!before) return { result: fail("not_found"), pending: null };

  const to = resolveTo(before.bookingStatus);
  if (to === null) {
    return {
      result: { success: true, moved: false, from: before.bookingStatus, to: before.bookingStatus },
      pending: null,
    };
  }

  const planned = planTransition(before, to, ctx);
  if (!planned.ok) return { result: fail(planned.reason), pending: null };
  let plan = planned.plan;

  if (plan.changed) {
    // The status check and the race guard are one condition: the write only
    // lands while the booking is still where the plan started.
    const { count } = await db.booking.updateMany({
      where: { id, bookingStatus: before.bookingStatus },
      data: plan.patch,
    });
    if (count === 0) return { result: fail("stale"), pending: null };

    if (plan.ownerClaim) {
      const claim = await db.booking.updateMany({
        where: { id, agentId: null },
        data: { agentId: plan.ownerClaim },
      });
      if (claim.count === 0 && plan.event) {
        // Someone assigned an owner in the meantime; history must not claim otherwise.
        const event = { ...plan.event };
        delete event.toAgentId;
        plan = { ...plan, ownerClaim: null, event };
      }
    }
  }

  return {
    result: { success: true, moved: plan.changed, from: plan.from, to: plan.to },
    pending: { bookingId: id, date: before.date, plan },
  };
}

/** After commit: history, then each plan's effects in order, then the cache. Never throws. */
async function settle(pending: Pending[], opts: { revalidate: boolean }) {
  for (const { bookingId, date, plan } of pending) {
    if (plan.event) await logBookingEvents([{ bookingId, ...plan.event }]);
    await runEffects(bookingId, date, plan.effects);
  }
  if (opts.revalidate && pending.length > 0) {
    try {
      revalidatePath("/bookings", "layout");
      revalidatePath("/reception");
    } catch (error) {
      console.error("Booking revalidation error:", error);
    }
  }
}

async function moveAndSettle(
  id: string,
  resolveTo: (from: BookingStatus) => BookingStatus | null,
  ctx: PlanContext,
): Promise<MoveResult> {
  const { result, pending } = await stage(prisma, id, resolveTo, ctx);
  await settle(pending ? [pending] : [], { revalidate: true });
  return result;
}

const staffContext = (by: string | null | undefined): PlanContext => ({
  source: BookingEventSource.STAFF,
  actorId: by ?? null,
  now: new Date(),
});

const flashContext = (): PlanContext => ({
  source: BookingEventSource.PAYMENT,
  cause: "payment",
  now: new Date(),
});

/* -------------------------------------------------------------------------- */
/*  Single moves                                                              */
/* -------------------------------------------------------------------------- */

/** A staff member moves a booking to `to` (the status picker, check-in, decline). */
export function moveTo(id: string, to: BookingStatus, by: string | null | undefined) {
  return moveAndSettle(id, () => to, staffContext(by));
}

/** The first contact on a new booking moves it to CONTACTED; any later status is left alone. */
export async function markContacted(id: string, by: string | null | undefined) {
  const result = await moveAndSettle(
    id,
    (from) => (from === BookingStatus.PENDING ? BookingStatus.CONTACTED : null),
    staffContext(by),
  );
  // Losing the race to another move is fine here: the booking is past PENDING.
  return !result.success && result.reason === "stale"
    ? ({ success: true, moved: false, from: null, to: BookingStatus.CONTACTED } as const)
    : result;
}

/* -------------------------------------------------------------------------- */
/*  Moves inside a transaction                                                */
/* -------------------------------------------------------------------------- */

export type StagedLifecycle = {
  moveTo(id: string, to: BookingStatus, by: string | null | undefined): Promise<MoveResult>;
  /**
   * Staff recorded money on this booking: confirm it from any open, cancelled
   * or expired status; leave ARRIVED, DECLINED and NO_RESPONSE_EXPIRED where
   * they are. Sends the once-only confirmation email when it ends CONFIRMED.
   */
  paymentRecorded(id: string, by: string | null | undefined): Promise<MoveResult>;
  /**
   * A Flash payment passed every settlement check: confirm the booking. After
   * commit, an unowned booking goes to whoever last requested payment, the
   * date's capacity is checked, and the confirmation email goes once.
   */
  confirmByPayment(id: string): Promise<MoveResult>;
  /** A Flash payment needs a human: late, wrong amount, wrong order, or a second charge. */
  flagForReview(id: string): Promise<MoveResult>;
};

/**
 * Run `fn` in one database transaction, giving it lifecycle moves that commit
 * with the rest of its writes. Effects of those moves run only after the
 * transaction commits, and only for the attempt that committed; a
 * serialization failure (P2034) retries the whole function.
 */
export async function transaction<T>(
  fn: (lifecycle: StagedLifecycle, tx: Db) => Promise<T>,
  opts: { serializable?: boolean; retries?: number } = {},
): Promise<T> {
  const attempts = opts.retries ?? 3;
  for (let attempt = 1; ; attempt++) {
    const staged: Pending[] = [];
    let value: T;
    try {
      value = await prisma.$transaction(
        (tx) => {
          const keep = async (step: Promise<{ result: MoveResult; pending: Pending | null }>) => {
            const { result, pending } = await step;
            if (pending) staged.push(pending);
            return result;
          };
          return fn(
            {
              moveTo: (id, to, by) => keep(stage(tx, id, () => to, staffContext(by))),
              paymentRecorded: (id, by) =>
                keep(stage(tx, id, paymentTarget, { ...staffContext(by), cause: "payment" })),
              confirmByPayment: (id) =>
                keep(stage(tx, id, () => BookingStatus.CONFIRMED, flashContext())),
              flagForReview: (id) =>
                keep(stage(tx, id, () => BookingStatus.UNDER_REVIEW, flashContext())),
            },
            tx,
          );
        },
        {
          timeout: 30000,
          ...(opts.serializable
            ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            : {}),
        },
      );
    } catch (error) {
      if ((error as { code?: string })?.code === "P2034" && attempt < attempts) continue;
      throw error;
    }
    await settle(staged, { revalidate: true });
    return value;
  }
}

/* -------------------------------------------------------------------------- */
/*  Creation                                                                  */
/* -------------------------------------------------------------------------- */

/** Columns only the lifecycle writes: a creator states the status, not these. */
type LifecycleColumn =
  | "bookingStatus"
  | "waitingPaymentAt"
  | "paymentDueAt"
  | "dateFullNoticeAt"
  | "paymentLinkExpiresAt"
  | "confirmationEmailSentAt"
  | "paymentRequestEmailWindowAt"
  | "cancellationEmailSentAt";

export type AdmitData = Omit<Prisma.BookingUncheckedCreateInput, LifecycleColumn>;

export type AdmitResult =
  | { success: true; booking: Booking }
  | { success: false; reason: RefusalReason; message: string };

/**
 * Create a booking in its first status, with the same consequences as moving
 * an existing booking there: a payment window for WAITING_PAYMENT, a capacity
 * check for CONFIRMED and ARRIVED. Never sends the confirmation email itself;
 * a creator whose own email already says "confirmed" passes
 * `confirmationEmailClaimed` so a later payment doesn't send a second one.
 */
export async function admit(
  data: AdmitData,
  status: BookingStatus,
  opts: { source: BookingEventSource; actorId?: string | null; confirmationEmailClaimed?: boolean },
): Promise<AdmitResult> {
  const now = new Date();
  const planned = planTransition(
    {
      bookingStatus: null,
      date: new Date(data.date),
      agentId: data.agentId ?? null,
      paymentLinkExpiresAt: null,
    },
    status,
    { source: opts.source, actorId: opts.actorId ?? null, now },
  );
  if (!planned.ok) {
    return { success: false, reason: planned.reason, message: REFUSAL_MESSAGE[planned.reason] };
  }
  const plan = planned.plan;
  const agentId = plan.ownerClaim ?? data.agentId ?? null;

  const booking = await prisma.booking.create({
    data: {
      ...data,
      ...plan.patch,
      agentId,
      ...(opts.confirmationEmailClaimed ? { confirmationEmailSentAt: now } : {}),
    },
  });

  const event = plan.event && agentId ? { ...plan.event, toAgentId: agentId } : plan.event;
  await settle([{ bookingId: booking.id, date: booking.date, plan: { ...plan, event } }], {
    revalidate: true,
  });
  return { success: true, booking };
}

/* -------------------------------------------------------------------------- */
/*  Sweeps: batch moves that never email and never touch the cache, so they   */
/*  are safe on render paths. The cron route revalidates for itself.          */
/* -------------------------------------------------------------------------- */

/**
 * Cancel WAITING_PAYMENT bookings whose payment deadline has passed. A booking
 * with no deadline (the guest never generated a link) is left for
 * `expirePastDates`. The "we released your spot" email is the cron's job
 * (sendReleasedHoldEmails), keyed on the CRON history this writes.
 */
export async function cancelLapsedHolds(scope: { id?: string } = {}): Promise<number> {
  const expired = await prisma.booking.updateManyAndReturn({
    where: {
      ...(scope.id ? { id: scope.id } : {}),
      bookingStatus: BookingStatus.WAITING_PAYMENT,
      paymentDueAt: { not: null, lt: new Date() },
    },
    data: { bookingStatus: BookingStatus.CANCELED },
    select: { id: true },
  });
  await logBookingEvents(
    expired.map((b) => ({
      bookingId: b.id,
      source: BookingEventSource.CRON,
      fromStatus: BookingStatus.WAITING_PAYMENT,
      toStatus: BookingStatus.CANCELED,
    })),
  );
  return expired.length;
}

/**
 * Close bookings still open after their visit date (Cairo) as EXPIRED. Nothing
 * is emailed: the outcome is unknown. A booking holding a Flash payment waits
 * for staff instead, since there is money to confirm or refund. One statement
 * per open status, so each history row knows where its booking came from.
 */
export async function expirePastDates(): Promise<number> {
  const today = utcMidnightFromKey(dateKeyInCairo());
  let total = 0;
  for (const from of ACTIVE_PENDING_STATUSES) {
    const expired = await prisma.booking.updateManyAndReturn({
      where: {
        bookingStatus: from,
        date: { lt: today },
        payments: { none: { flashTransactionId: { not: null } } },
      },
      data: { bookingStatus: BookingStatus.EXPIRED },
      select: { id: true },
    });
    await logBookingEvents(
      expired.map((b) => ({
        bookingId: b.id,
        source: BookingEventSource.CRON,
        fromStatus: from,
        toStatus: BookingStatus.EXPIRED,
      })),
    );
    total += expired.length;
  }
  return total;
}

/** Cancel the given bookings that are still PENDING (the "date is fully booked" notice). */
export async function cancelPending(ids: string[], by: string | null | undefined): Promise<number> {
  if (ids.length === 0) return 0;
  const canceled = await prisma.booking.updateManyAndReturn({
    where: { id: { in: ids }, bookingStatus: BookingStatus.PENDING },
    data: { bookingStatus: BookingStatus.CANCELED },
    select: { id: true },
  });
  await logBookingEvents(
    canceled.map((b) => ({
      bookingId: b.id,
      source: BookingEventSource.STAFF,
      actorId: by ?? null,
      fromStatus: BookingStatus.PENDING,
      toStatus: BookingStatus.CANCELED,
    })),
  );
  return canceled.length;
}
