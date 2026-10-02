import { addMonths } from "date-fns";

/**
 * One calendar-day convention for Day Use pricing and availability.
 *
 * A `DateKey` is a `YYYY-MM-DD` string for the venue's calendar day. Booking
 * and closed dates are stored as the UTC midnight of that key. The three ways
 * a `Date` reaches us are converted explicitly, because each one means a
 * different thing:
 *
 * - a stored booking/closed date is a UTC midnight → `dateKeyFromUtcMidnight`
 * - a DayPicker cell is a *local* midnight in the browser's timezone, which in
 *   Cairo (UTC+2/+3) is the previous UTC day → `dateKeyFromLocalCalendar`
 * - "now" is an instant, and its day belongs to Cairo → `dateKeyInCairo`
 *
 * Never mix them with ad hoc offsets in a caller.
 */
export type DateKey = string;

export const BUSINESS_TIME_ZONE = "Africa/Cairo";

/** Guests can book this many months ahead, matching the closed-date window. */
export const DAY_USE_BOOKING_HORIZON_MONTHS = 6;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

/** True only for a real calendar day written as `YYYY-MM-DD`. */
export function isDateKey(value: string): value is DateKey {
  const match = DATE_KEY_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** A stored booking or closed date (UTC midnight) → its day key. */
export function dateKeyFromUtcMidnight(date: Date): DateKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** A DayPicker day (local midnight in the browser) → the day the guest saw. */
export function dateKeyFromLocalCalendar(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The venue's calendar day for an instant. */
export function dateKeyInCairo(instant: Date = new Date()): DateKey {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Day key → the UTC midnight the database stores. */
export function utcMidnightFromKey(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Day key → a local-midnight `Date`, the shape DayPicker renders and compares. */
export function localCalendarDateFromKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar arithmetic on keys, independent of any timezone. */
export function addMonthsToKey(key: DateKey, months: number): DateKey {
  return dateKeyFromLocalCalendar(addMonths(localCalendarDateFromKey(key), months));
}

/**
 * The rolling window a guest may book: Cairo today through the same day
 * `DAY_USE_BOOKING_HORIZON_MONTHS` later, inclusive. The calendar and the
 * server both read it from here so they cannot disagree about the last day.
 */
export function getDayUseBookingWindow(now: Date = new Date()): {
  firstKey: DateKey;
  lastKey: DateKey;
} {
  const firstKey = dateKeyInCairo(now);
  return {
    firstKey,
    lastKey: addMonthsToKey(firstKey, DAY_USE_BOOKING_HORIZON_MONTHS),
  };
}

export function isWithinDayUseBookingWindow(key: DateKey, now: Date = new Date()): boolean {
  const { firstKey, lastKey } = getDayUseBookingWindow(now);
  return key >= firstKey && key <= lastKey;
}

/** Day key shifted by whole calendar days, independent of any timezone. */
export function addDaysToKey(key: DateKey, days: number): DateKey {
  const shifted = utcMidnightFromKey(key);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return dateKeyFromUtcMidnight(shifted);
}

/** Minutes Cairo's wall clock is ahead of UTC at `instant` (120, or 180 in DST). */
function cairoOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallClock = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
  );
  return Math.round((wallClock - instant.getTime()) / 60000);
}

/**
 * Day key → the instant that day starts in Cairo. For timestamps (`createdAt`
 * and the like), which are instants — unlike booking dates, which are stored as
 * UTC midnights and compared with `utcMidnightFromKey`.
 */
export function cairoDayStart(key: DateKey): Date {
  const utcMidnight = utcMidnightFromKey(key).getTime();
  const guess = new Date(utcMidnight - cairoOffsetMinutes(new Date(utcMidnight)) * 60000);
  // The offset at UTC midnight can differ from the one at Cairo midnight on a
  // DST switch day, so re-read it at the guessed instant.
  return new Date(utcMidnight - cairoOffsetMinutes(guess) * 60000);
}
