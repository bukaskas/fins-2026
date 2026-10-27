import { BookingContactOutcome, BookingStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  addWorkingTime,
  followUp,
  type FollowUpContact,
} from "@/lib/bookings/follow-up";

// October is Egyptian summer time: Cairo is UTC+3.
const cairo = (iso: string) => new Date(`${iso}+03:00`);
const sent = (iso: string): FollowUpContact => ({
  createdAt: cairo(iso),
  outcome: BookingContactOutcome.ATTEMPTED,
});
const replied = (iso: string): FollowUpContact => ({
  createdAt: cairo(iso),
  outcome: BookingContactOutcome.REACHED,
});
const contacted = { bookingStatus: BookingStatus.CONTACTED };

describe("addWorkingTime", () => {
  it("adds straight through inside working hours", () => {
    expect(addWorkingTime(cairo("2026-10-14T10:00"), 6 * 3600e3)).toEqual(
      cairo("2026-10-14T16:00"),
    );
  });

  it("stops the clock overnight", () => {
    // 22:00 → 23:00 is one hour; the other five run from 09:00.
    expect(addWorkingTime(cairo("2026-10-14T22:00"), 6 * 3600e3)).toEqual(
      cairo("2026-10-15T14:00"),
    );
  });

  it("starts a contact made overnight at opening", () => {
    expect(addWorkingTime(cairo("2026-10-15T02:00"), 6 * 3600e3)).toEqual(
      cairo("2026-10-15T15:00"),
    );
  });

  it("lands exactly on closing without spilling into tomorrow", () => {
    expect(addWorkingTime(cairo("2026-10-14T17:00"), 6 * 3600e3)).toEqual(
      cairo("2026-10-14T23:00"),
    );
  });
});

describe("followUp", () => {
  it("is not chased outside PENDING and CONTACTED", () => {
    const f = followUp(
      { bookingStatus: BookingStatus.WAITING_PAYMENT },
      [sent("2026-10-14T10:00")],
      cairo("2026-10-15T10:00"),
    );
    expect(f.stage).toBe("none");
  });

  it("asks for a first contact on a new booking", () => {
    const f = followUp({ bookingStatus: BookingStatus.PENDING }, [], cairo("2026-10-14T10:00"));
    expect(f).toMatchObject({ stage: "not_contacted", attempts: 0, dueAt: null });
  });

  it("waits six working hours after a contact, then is due", () => {
    const contacts = [sent("2026-10-14T10:00")];
    expect(followUp(contacted, contacts, cairo("2026-10-14T15:59"))).toMatchObject({
      stage: "waiting",
      attempts: 1,
      dueAt: cairo("2026-10-14T16:00"),
    });
    expect(followUp(contacted, contacts, cairo("2026-10-14T16:00")).stage).toBe("due");
  });

  it("flags the booking once three attempts go unanswered", () => {
    const contacts = [
      sent("2026-10-14T10:00"),
      sent("2026-10-14T16:00"),
      sent("2026-10-14T22:00"),
    ];
    expect(followUp(contacted, contacts, cairo("2026-10-15T13:00")).stage).toBe("waiting");
    expect(followUp(contacted, contacts, cairo("2026-10-15T14:00"))).toMatchObject({
      stage: "flagged",
      attempts: 3,
    });
  });

  it("counts a double tap as one attempt", () => {
    const f = followUp(
      contacted,
      [sent("2026-10-14T10:00"), sent("2026-10-14T10:00:40"), sent("2026-10-14T10:01")],
      cairo("2026-10-14T11:00"),
    );
    expect(f.attempts).toBe(1);
  });

  it("stops the clock when the guest replies, and counts again after", () => {
    const answered = [sent("2026-10-14T10:00"), replied("2026-10-14T11:00")];
    expect(followUp(contacted, answered, cairo("2026-10-15T20:00"))).toMatchObject({
      stage: "replied",
      attempts: 0,
      dueAt: null,
    });

    const nudgedAgain = [...answered, sent("2026-10-14T12:00")];
    expect(followUp(contacted, nudgedAgain, cairo("2026-10-14T13:00"))).toMatchObject({
      stage: "waiting",
      attempts: 1,
    });
  });

  it("orders contacts by time, whatever order they arrive in", () => {
    const f = followUp(
      contacted,
      [replied("2026-10-14T11:00"), sent("2026-10-14T10:00")],
      cairo("2026-10-14T12:00"),
    );
    expect(f.stage).toBe("replied");
  });

  it("honours a follow-up time staff set on the latest contact", () => {
    const f = followUp(
      contacted,
      [{ ...sent("2026-10-14T10:00"), nextContactAt: cairo("2026-10-14T11:00") }],
      cairo("2026-10-14T11:30"),
    );
    expect(f).toMatchObject({ stage: "due", dueAt: cairo("2026-10-14T11:00") });
  });
});
