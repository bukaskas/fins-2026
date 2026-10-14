import { describe, expect, it } from "vitest";
import {
  depositCents,
  depositDueCents,
  formatPaymentDeadline,
  formatPaymentDeadlineShort,
  bookingDayEnd,
  dueAtForLink,
  dueAtOnFullDate,
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

// Booking dates are stored as UTC midnights of the venue's day.
const SAT_10_OCT = new Date("2026-10-10T00:00:00.000Z");

describe("bookingDayEnd", () => {
  it("is the next Cairo midnight, in summer time (UTC+3)", () => {
    expect(bookingDayEnd(SAT_10_OCT).toISOString()).toBe("2026-10-10T21:00:00.000Z");
  });

  it("is the next Cairo midnight, in winter time (UTC+2)", () => {
    expect(bookingDayEnd(new Date("2026-12-05T00:00:00.000Z")).toISOString()).toBe(
      "2026-12-05T22:00:00.000Z",
    );
  });
});

describe("dueAtForLink", () => {
  it("gives 24 hours from the first link", () => {
    const now = new Date("2026-10-05T11:30:00.000Z");
    expect(dueAtForLink(now, SAT_10_OCT, null).toISOString()).toBe("2026-10-06T11:30:00.000Z");
  });

  it("lets a link made the evening before be paid the next morning", () => {
    const now = new Date("2026-10-09T18:00:00.000Z"); // Fri 21:00 Cairo
    expect(dueAtForLink(now, SAT_10_OCT, null).toISOString()).toBe("2026-10-10T18:00:00.000Z");
  });

  it("cuts a link made on the day at the end of the day", () => {
    const now = new Date("2026-10-10T09:00:00.000Z"); // Sat 12:00 Cairo
    expect(dueAtForLink(now, SAT_10_OCT, null).toISOString()).toBe("2026-10-10T21:00:00.000Z");
  });

  it("never restarts a deadline that is already running", () => {
    const due = new Date("2026-10-06T02:00:00.000Z");
    const now = new Date("2026-10-05T20:00:00.000Z");
    expect(dueAtForLink(now, SAT_10_OCT, due)).toBe(due);
  });
});

describe("dueAtOnFullDate", () => {
  const now = new Date("2026-10-05T11:30:00.000Z");

  it("gives 12 hours when no clock was running", () => {
    expect(dueAtOnFullDate(now, SAT_10_OCT, null).toISOString()).toBe("2026-10-05T23:30:00.000Z");
  });

  it("pulls a later deadline in to 12 hours", () => {
    const due = new Date("2026-10-06T11:30:00.000Z");
    expect(dueAtOnFullDate(now, SAT_10_OCT, due).toISOString()).toBe("2026-10-05T23:30:00.000Z");
  });

  it("never extends a deadline that is already sooner", () => {
    const due = new Date("2026-10-05T15:00:00.000Z");
    expect(dueAtOnFullDate(now, SAT_10_OCT, due).toISOString()).toBe(due.toISOString());
  });

  it("never runs past the booking day", () => {
    const late = new Date("2026-10-10T15:00:00.000Z");
    expect(dueAtOnFullDate(late, SAT_10_OCT, null).toISOString()).toBe("2026-10-10T21:00:00.000Z");
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
