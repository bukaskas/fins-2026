import { describe, expect, it } from "vitest";
import {
  depositCents,
  depositDueCents,
  formatPaymentDeadline,
  formatPaymentDeadlineShort,
  paymentDeadline,
} from "@/lib/bookings/payment-window";

describe("depositCents", () => {
  it("is half the total, rounded to a whole cent", () => {
    expect(depositCents(400000)).toBe(200000);
    expect(depositCents(1001)).toBe(501);
  });
});

describe("depositDueCents", () => {
  it("subtracts what was already paid and never goes negative", () => {
    expect(depositDueCents(400000, 0)).toBe(200000);
    expect(depositDueCents(400000, 50000)).toBe(150000);
    expect(depositDueCents(400000, 300000)).toBe(0);
  });
});

describe("paymentDeadline", () => {
  it("is 24 hours after the window opened", () => {
    expect(paymentDeadline(new Date("2026-10-05T11:30:00.000Z")).toISOString()).toBe(
      "2026-10-06T11:30:00.000Z",
    );
  });
});

describe("formatPaymentDeadline", () => {
  // Egypt observes summer time (UTC+3) until the last Friday of October, then
  // UTC+2; the formatter must follow the venue's clock, not the server's.
  it("prints the venue's wall-clock time in summer", () => {
    expect(formatPaymentDeadline(new Date("2026-10-06T11:30:00.000Z"))).toBe(
      "Tuesday 6 October, 14:30 (Cairo time)",
    );
  });

  it("prints the venue's wall-clock time in winter", () => {
    expect(formatPaymentDeadline(new Date("2026-12-01T08:05:00.000Z"))).toBe(
      "Tuesday 1 December, 10:05 (Cairo time)",
    );
  });

  it("has a short form for the inbox preview line", () => {
    expect(formatPaymentDeadlineShort(new Date("2026-10-06T11:30:00.000Z"))).toBe(
      "Tue 6 Oct, 14:30",
    );
  });
});

describe("pay in full (spectator pass)", () => {
  it("asks for the whole total online", () => {
    expect(depositCents(450000, true)).toBe(450000);
    expect(depositDueCents(450000, 0, true)).toBe(450000);
    expect(depositDueCents(450000, 450000, true)).toBe(0);
  });

  it("leaves the 50% default alone", () => {
    expect(depositCents(450000)).toBe(225000);
  });
});
