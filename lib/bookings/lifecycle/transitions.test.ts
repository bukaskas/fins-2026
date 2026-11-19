import { describe, expect, it } from "vitest";
import { BookingStatus as S } from "@prisma/client";

import { ALLOWED, allowedTargets, canMove, paymentTarget } from "./transitions";

describe("ALLOWED", () => {
  it("has a row for every status and for a new booking", () => {
    for (const status of Object.values(S)) expect(ALLOWED[status]).toBeDefined();
    expect(ALLOWED.NEW).toBeDefined();
  });

  it("creates bookings only as PENDING, WAITING_PAYMENT, CONFIRMED or ARRIVED", () => {
    expect([...allowedTargets(null)].sort()).toEqual(
      [S.ARRIVED, S.CONFIRMED, S.PENDING, S.WAITING_PAYMENT].sort(),
    );
    expect(canMove(null, S.DECLINED)).toBe(false);
    expect(canMove(null, S.EXPIRED)).toBe(false);
  });

  it("never reopens DECLINED or NO_RESPONSE_EXPIRED, except for review", () => {
    expect(allowedTargets(S.DECLINED)).toEqual([S.UNDER_REVIEW]);
    expect(allowedTargets(S.NO_RESPONSE_EXPIRED)).toEqual([S.UNDER_REVIEW]);
  });

  it("reopens CANCELED and EXPIRED to WAITING_PAYMENT, or confirms them on payment", () => {
    for (const from of [S.CANCELED, S.EXPIRED]) {
      expect([...allowedTargets(from)].sort()).toEqual(
        [S.CONFIRMED, S.UNDER_REVIEW, S.WAITING_PAYMENT].sort(),
      );
    }
  });

  it("can send any booking to review, since money can arrive at any time", () => {
    for (const from of Object.values(S)) {
      if (from !== S.UNDER_REVIEW) expect(canMove(from, S.UNDER_REVIEW)).toBe(true);
    }
  });

  it("treats reopening the payment window as a real move", () => {
    expect(canMove(S.WAITING_PAYMENT, S.WAITING_PAYMENT)).toBe(true);
  });

  it("never moves an arrived guest anywhere but review or an undo to CONFIRMED", () => {
    expect([...allowedTargets(S.ARRIVED)].sort()).toEqual([S.CONFIRMED, S.UNDER_REVIEW].sort());
  });

  it("only lets a booking arrive once it is confirmed", () => {
    for (const from of Object.values(S)) {
      expect(canMove(from, S.ARRIVED)).toBe(from === S.CONFIRMED);
    }
  });
});

describe("paymentTarget", () => {
  it("confirms an open, cancelled or expired booking", () => {
    for (const from of [S.PENDING, S.CONTACTED, S.UNDER_REVIEW, S.WAITING_PAYMENT, S.CANCELED, S.EXPIRED]) {
      expect(paymentTarget(from)).toBe(S.CONFIRMED);
    }
  });

  it("keeps a confirmed booking confirmed", () => {
    expect(paymentTarget(S.CONFIRMED)).toBe(S.CONFIRMED);
  });

  it("records money without moving an arrived, declined or no-response booking", () => {
    expect(paymentTarget(S.ARRIVED)).toBeNull();
    expect(paymentTarget(S.DECLINED)).toBeNull();
    expect(paymentTarget(S.NO_RESPONSE_EXPIRED)).toBeNull();
  });

  it("only ever targets a move the table allows", () => {
    for (const from of Object.values(S)) {
      const to = paymentTarget(from);
      if (to && to !== from) expect(canMove(from, to)).toBe(true);
    }
  });
});
