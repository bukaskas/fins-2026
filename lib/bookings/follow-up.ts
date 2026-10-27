import { BookingContactOutcome, BookingStatus } from "@prisma/client";

import { addDaysToKey, cairoDayStart, dateKeyInCairo } from "@/lib/date-keys";

/**
 * When a booking needs its next nudge, read from its contact log.
 *
 * The one place that answers "who do we chase, and when". The reception queue,
 * the booking page and the agent stats all ask here instead of keeping their
 * own clocks. Contact is history (`BookingContact`), never a status: the status
 * only says where the booking stands, and this derives the timer from the log.
 *
 * Rules:
 * - Only bookings still waiting on the guest are chased: PENDING (never
 *   contacted) and CONTACTED. A WAITING_PAYMENT booking runs on its payment
 *   deadline instead (lib/bookings/payment-window.ts).
 * - A follow-up is due `FOLLOW_UP_AFTER_MS` of working time after the last
 *   contact. The clock only runs inside `WORKING_HOURS` (Cairo): a message
 *   sent at 22:00 has one hour counted that night and the rest from 09:00.
 * - A contact with outcome REACHED means the guest replied: the clock stops
 *   and attempts start again from zero after it.
 * - Contacts within `REPEAT_WINDOW_MS` of the previous one count as one
 *   attempt: a double tap is not a second nudge.
 * - After `MAX_ATTEMPTS` unanswered contacts, a follow-up that comes due is
 *   flagged for staff to decide instead. Nothing changes status on its own.
 * - A staff-set `nextContactAt` on the latest contact overrides the computed
 *   due time.
 */

export const FOLLOW_UP_AFTER_MS = 6 * 60 * 60 * 1000;
export const MAX_ATTEMPTS = 3;
/** Same-outcome contacts closer together than this are one attempt. */
export const REPEAT_WINDOW_MS = 2 * 60 * 1000;
/** Cairo wall-clock hours the follow-up clock runs: 09:00–23:00. */
export const WORKING_HOURS = { open: 9, close: 23 } as const;

const HOUR_MS = 60 * 60 * 1000;

const CHASED_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONTACTED,
];

export type FollowUpContact = {
  createdAt: Date;
  outcome: BookingContactOutcome;
  nextContactAt?: Date | null;
};

export type FollowUpStage =
  /** Open, and nobody has reached out yet. */
  | "not_contacted"
  /** Contacted; the next nudge is not due yet. */
  | "waiting"
  /** The next nudge is due now. */
  | "due"
  /** `MAX_ATTEMPTS` went unanswered: staff decide what happens next. */
  | "flagged"
  /** The guest answered the last contact; the move is staff's. */
  | "replied"
  /** Not chased in this status. */
  | "none";

export type FollowUp = {
  stage: FollowUpStage;
  lastContactAt: Date | null;
  /** Contacts since the guest last replied. */
  attempts: number;
  /** When the next nudge is due; null when nothing is scheduled. */
  dueAt: Date | null;
};

/** `start` plus `ms` of time counted only inside working hours (Cairo). */
export function addWorkingTime(start: Date, ms: number): Date {
  let key = dateKeyInCairo(start);
  let t = start.getTime();
  let remaining = ms;
  for (;;) {
    const dayStart = cairoDayStart(key).getTime();
    const open = dayStart + WORKING_HOURS.open * HOUR_MS;
    const close = dayStart + WORKING_HOURS.close * HOUR_MS;
    if (t < open) t = open;
    if (t < close) {
      if (remaining <= close - t) return new Date(t + remaining);
      remaining -= close - t;
    }
    key = addDaysToKey(key, 1);
    t = cairoDayStart(key).getTime();
  }
}

export function followUp(
  booking: { bookingStatus: BookingStatus },
  contacts: FollowUpContact[],
  now: Date,
): FollowUp {
  const sorted = [...contacts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const last = sorted.at(-1) ?? null;
  const lastContactAt = last?.createdAt ?? null;
  const lastReply = sorted.findLastIndex(
    (c) => c.outcome === BookingContactOutcome.REACHED,
  );
  const attempts = sorted
    .slice(lastReply + 1)
    .filter(
      (c, i, since) =>
        i === 0 ||
        c.createdAt.getTime() - since[i - 1].createdAt.getTime() >= REPEAT_WINDOW_MS,
    ).length;

  if (!CHASED_STATUSES.includes(booking.bookingStatus)) {
    return { stage: "none", lastContactAt, attempts, dueAt: null };
  }
  if (!last) {
    return { stage: "not_contacted", lastContactAt, attempts, dueAt: null };
  }
  if (attempts === 0) {
    return { stage: "replied", lastContactAt, attempts, dueAt: null };
  }

  const dueAt =
    last.nextContactAt ?? addWorkingTime(last.createdAt, FOLLOW_UP_AFTER_MS);
  const stage =
    now < dueAt ? "waiting" : attempts >= MAX_ATTEMPTS ? "flagged" : "due";
  return { stage, lastContactAt, attempts, dueAt };
}

/** Whether staff owe this booking an action now. */
export function needsAction(f: FollowUp): boolean {
  return (
    f.stage === "not_contacted" ||
    f.stage === "due" ||
    f.stage === "flagged" ||
    f.stage === "replied"
  );
}
