import { BookingStatus } from "@prisma/client";

import { DAILY_CAPACITY } from "@/lib/constants";

/** Statuses that hold a place against the daily capacity. */
export const CAPACITY_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.ARRIVED,
];

/** Share of capacity at which a still-open day reads as "Nearly full". */
const NEARLY_FULL_PERCENT = 80;

/** Adults plus kids in bookings that hold a place. Each booking counts once. */
export function capacityPeople(
  bookings: { bookingStatus: BookingStatus; numberOfPeople: number; numberOfKids: number | null }[],
) {
  return bookings
    .filter((b) => CAPACITY_STATUSES.includes(b.bookingStatus))
    .reduce((sum, b) => sum + b.numberOfPeople + (b.numberOfKids ?? 0), 0);
}

export type CapacityLevel = "closed" | "nearlyFull" | "available";

/**
 * One reading of a day's capacity, shared by /reception and the date page so
 * "Nearly full" and "Closed" mean the same thing everywhere. `closed` is the
 * ClosedDate row, which staff can also set below capacity.
 */
export function capacityState(people: number, closed: boolean) {
  const percent = Math.min(100, Math.round((people / DAILY_CAPACITY) * 100));
  const level: CapacityLevel = closed
    ? "closed"
    : percent >= NEARLY_FULL_PERCENT
      ? "nearlyFull"
      : "available";
  const label = { closed: "Closed", nearlyFull: "Nearly full", available: "Available" }[level];
  return { people, capacity: DAILY_CAPACITY, percent, level, label };
}
