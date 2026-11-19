import { describe, expect, it } from "vitest";
import { BookingEventSource as Src, BookingStatus as S } from "@prisma/client";

import { planTransition, type LifecycleSnapshot, type PlanContext } from "./plan";

// Booking dates are UTC midnights of the venue's day. 10:00Z is 12:00 in Cairo.
const NOW = new Date("2026-11-18T10:00:00.000Z");
const FUTURE = new Date("2026-11-25T00:00:00.000Z");
const TODAY = new Date("2026-11-18T00:00:00.000Z");
const PAST = new Date("2026-11-10T00:00:00.000Z");

const booking = (over: Partial<LifecycleSnapshot> = {}): LifecycleSnapshot => ({
  bookingStatus: S.PENDING,
  date: FUTURE,
  agentId: null,
  paymentLinkExpiresAt: null,
  ...over,
});
const staff: PlanContext = { source: Src.STAFF, actorId: "staff-1", now: NOW };
const staffPayment: PlanContext = { ...staff, cause: "payment" };
const flash: PlanContext = { source: Src.PAYMENT, cause: "payment", now: NOW };

function plan(snapshot: LifecycleSnapshot, to: S, ctx: PlanContext) {
  const result = planTransition(snapshot, to, ctx);
  if (!result.ok) throw new Error(`expected a plan, got ${result.reason}`);
  return result.plan;
}

describe("refusals", () => {
  it("refuses a move the table does not allow", () => {
    expect(planTransition(booking({ bookingStatus: S.DECLINED }), S.CONFIRMED, staff)).toEqual({
      ok: false,
      reason: "not_allowed",
    });
  });

  it("refuses to open a payment window once the booking day is over", () => {
    expect(
      planTransition(booking({ bookingStatus: S.EXPIRED, date: PAST }), S.WAITING_PAYMENT, staff),
    ).toEqual({ ok: false, reason: "date_passed" });
  });

  it("still opens a payment window on the booking day itself", () => {
    expect(planTransition(booking({ date: TODAY }), S.WAITING_PAYMENT, staff).ok).toBe(true);
  });

  it("reopens an expired booking once staff have moved it to a future date", () => {
    expect(
      planTransition(booking({ bookingStatus: S.EXPIRED, date: FUTURE }), S.WAITING_PAYMENT, staff).ok,
    ).toBe(true);
  });
});

describe("plain moves", () => {
  it("guards the write on the status it was planned from", () => {
    expect(plan(booking(), S.CONTACTED, staff).guard).toEqual({ bookingStatus: S.PENDING });
  });

  it("records a first contact with no side effects", () => {
    const p = plan(booking(), S.CONTACTED, staff);
    expect(p.changed).toBe(true);
    expect(p.patch).toEqual({ bookingStatus: S.CONTACTED });
    expect(p.event).toEqual({
      source: Src.STAFF,
      actorId: "staff-1",
      fromStatus: S.PENDING,
      toStatus: S.CONTACTED,
    });
    expect(p.effects).toEqual([]);
  });

  it("does nothing for a same-status move outside the payment window", () => {
    const p = plan(booking({ bookingStatus: S.CONFIRMED, agentId: "a" }), S.CONFIRMED, staff);
    expect(p.changed).toBe(false);
    expect(p.patch).toEqual({});
    expect(p.event).toBeNull();
    expect(p.effects).toEqual([]);
  });

  it("checks a guest in with no ownership change or capacity check", () => {
    const p = plan(booking({ bookingStatus: S.CONFIRMED }), S.ARRIVED, staff);
    expect(p.ownerClaim).toBeNull();
    expect(p.effects).toEqual([]);
  });
});

describe("entering WAITING_PAYMENT", () => {
  it("opens a fresh window, then checks capacity, then emails the guest", () => {
    const p = plan(booking(), S.WAITING_PAYMENT, staff);
    expect(p.patch).toEqual({
      bookingStatus: S.WAITING_PAYMENT,
      waitingPaymentAt: NOW,
      paymentDueAt: null,
      dateFullNoticeAt: null,
      cancellationEmailSentAt: null,
    });
    expect(p.effects).toEqual(["cutDeadlineIfDateFull", "sendPaymentRequest"]);
  });

  it("voids a payment link that is still live", () => {
    const live = new Date(NOW.getTime() + 60_000);
    const p = plan(booking({ paymentLinkExpiresAt: live }), S.WAITING_PAYMENT, staff);
    expect(p.patch.paymentLinkExpiresAt).toEqual(NOW);
  });

  it("leaves an already-expired link alone", () => {
    const lapsed = new Date(NOW.getTime() - 60_000);
    const p = plan(booking({ paymentLinkExpiresAt: lapsed }), S.WAITING_PAYMENT, staff);
    expect(p.patch).not.toHaveProperty("paymentLinkExpiresAt");
  });

  it("treats reopening the window as a real move with history", () => {
    const p = plan(booking({ bookingStatus: S.WAITING_PAYMENT }), S.WAITING_PAYMENT, staff);
    expect(p.changed).toBe(true);
    expect(p.event).toMatchObject({ fromStatus: S.WAITING_PAYMENT, toStatus: S.WAITING_PAYMENT });
    expect(p.effects).toEqual(["cutDeadlineIfDateFull", "sendPaymentRequest"]);
  });

  it("clears the released-hold email claim so a second lapse is announced", () => {
    const p = plan(booking({ bookingStatus: S.CANCELED }), S.WAITING_PAYMENT, staff);
    expect(p.patch.cancellationEmailSentAt).toBeNull();
  });
});

describe("entering CONFIRMED", () => {
  it("gives an unowned booking to the staff member who confirms it", () => {
    const p = plan(booking(), S.CONFIRMED, staff);
    expect(p.ownerClaim).toBe("staff-1");
    expect(p.event).toMatchObject({ toAgentId: "staff-1" });
  });

  it("never moves an existing owner", () => {
    const p = plan(booking({ agentId: "owner" }), S.CONFIRMED, staff);
    expect(p.ownerClaim).toBeNull();
    expect(p.event).not.toHaveProperty("toAgentId");
  });

  it("checks capacity but sends no email when staff change the status", () => {
    expect(plan(booking(), S.CONFIRMED, staff).effects).toEqual(["closeDateIfFull"]);
  });

  it("on a staff payment: claims ownership, checks capacity, then emails", () => {
    const p = plan(booking({ bookingStatus: S.WAITING_PAYMENT }), S.CONFIRMED, staffPayment);
    expect(p.ownerClaim).toBe("staff-1");
    expect(p.effects).toEqual(["closeDateIfFull", "sendConfirmation"]);
  });

  it("on a staff payment, confirms a cancelled booking directly", () => {
    const p = plan(booking({ bookingStatus: S.CANCELED, date: PAST }), S.CONFIRMED, staffPayment);
    expect(p.changed).toBe(true);
    expect(p.effects).toEqual(["closeDateIfFull", "sendConfirmation"]);
  });

  it("on a Flash payment: hands an unowned booking to whoever requested payment", () => {
    const p = plan(booking({ bookingStatus: S.WAITING_PAYMENT }), S.CONFIRMED, flash);
    expect(p.ownerClaim).toBeNull();
    expect(p.event).toMatchObject({ source: Src.PAYMENT, actorId: null });
    expect(p.effects).toEqual(["assignPaymentRequester", "closeDateIfFull", "sendConfirmation"]);
  });

  it("on a Flash payment, leaves an owned booking's owner alone", () => {
    const p = plan(booking({ bookingStatus: S.WAITING_PAYMENT, agentId: "owner" }), S.CONFIRMED, flash);
    expect(p.effects).toEqual(["closeDateIfFull", "sendConfirmation"]);
  });

  it("on a payment to an already-confirmed booking, only sends the (once-only) email", () => {
    const p = plan(booking({ bookingStatus: S.CONFIRMED, agentId: "a" }), S.CONFIRMED, staffPayment);
    expect(p.changed).toBe(false);
    expect(p.event).toBeNull();
    expect(p.effects).toEqual(["sendConfirmation"]);
  });

  it("flags a late payment on a released hold for review, with history", () => {
    const p = plan(booking({ bookingStatus: S.CANCELED }), S.UNDER_REVIEW, flash);
    expect(p.changed).toBe(true);
    expect(p.event).toMatchObject({ source: Src.PAYMENT, fromStatus: S.CANCELED, toStatus: S.UNDER_REVIEW });
    expect(p.effects).toEqual([]);
  });

  it("flags a duplicate charge for review with no side effects", () => {
    const p = plan(booking({ bookingStatus: S.CONFIRMED, agentId: "a" }), S.UNDER_REVIEW, flash);
    expect(p.patch).toEqual({ bookingStatus: S.UNDER_REVIEW });
    expect(p.effects).toEqual([]);
  });
});

describe("creation", () => {
  const created = (over: Partial<LifecycleSnapshot> = {}) => booking({ bookingStatus: null, ...over });
  const guest: PlanContext = { source: Src.GUEST, now: NOW };

  it("records the first status with no previous one", () => {
    const p = plan(created(), S.PENDING, guest);
    expect(p.guard).toEqual({ bookingStatus: null });
    expect(p.event).toEqual({ source: Src.GUEST, actorId: null, fromStatus: null, toStatus: S.PENDING });
    expect(p.effects).toEqual([]);
  });

  it("checks capacity for a booking created CONFIRMED, without the confirmation email", () => {
    expect(plan(created(), S.CONFIRMED, guest).effects).toEqual(["closeDateIfFull"]);
  });

  it("checks capacity for a walk-in created ARRIVED", () => {
    expect(plan(created(), S.ARRIVED, staff).effects).toEqual(["closeDateIfFull"]);
  });

  it("opens the payment window for a booking created WAITING_PAYMENT", () => {
    const p = plan(created(), S.WAITING_PAYMENT, guest);
    expect(p.patch).toMatchObject({ waitingPaymentAt: NOW, paymentDueAt: null });
    expect(p.effects).toEqual(["cutDeadlineIfDateFull", "sendPaymentRequest"]);
  });

  it("refuses to create a closed booking", () => {
    expect(planTransition(created(), S.DECLINED, staff)).toEqual({ ok: false, reason: "not_allowed" });
  });
});
