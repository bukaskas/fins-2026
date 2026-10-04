import { STATUS_TEXT } from "@/lib/bookings/status";

/** One day's booking totals, as returned by getBookingCountsByDate. */
export type DayCount = {
  date: string; // YYYY-MM-DD
  confirmedPeople: number;
  confirmedCount: number;
  paymentPeople: number;
  paymentCount: number;
  reviewPeople: number;
  reviewCount: number;
  totalPeople: number;
  bookingCount: number;
};

export type CalendarSlice = "confirmed" | "payment" | "review";
export type CalendarFilter = "all" | CalendarSlice;

/**
 * The three numbers a calendar day can show, in display order. Colours come
 * from the status text palette so the dashboard matches badges elsewhere.
 */
export const CALENDAR_SLICES: {
  value: CalendarSlice;
  label: string;
  /** What the number counts, for the legend and screen readers. */
  meaning: string;
  color: string;
  people: (c: DayCount) => number;
}[] = [
  {
    value: "confirmed",
    label: "Confirmed",
    meaning: "confirmed or arrived",
    color: STATUS_TEXT.CONFIRMED,
    people: (c) => c.confirmedPeople,
  },
  {
    value: "payment",
    label: "Waiting payment",
    meaning: "waiting payment",
    color: STATUS_TEXT.WAITING_PAYMENT,
    people: (c) => c.paymentPeople,
  },
  {
    value: "review",
    label: "Needs review",
    meaning: "needs review",
    color: STATUS_TEXT.UNDER_REVIEW,
    people: (c) => c.reviewPeople,
  },
];

export const CALENDAR_FILTERS: { value: CalendarFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CALENDAR_SLICES.map(({ value, label }) => ({ value, label })),
];

export function parseCalendarFilter(value: string | undefined): CalendarFilter {
  return CALENDAR_FILTERS.some((f) => f.value === value)
    ? (value as CalendarFilter)
    : "all";
}

/** Slices visible under a filter: all three, or just the one picked. */
export function visibleSlices(filter: CalendarFilter) {
  return filter === "all"
    ? CALENDAR_SLICES
    : CALENDAR_SLICES.filter((s) => s.value === filter);
}

export function peopleFor(filter: CalendarFilter, c: DayCount) {
  return visibleSlices(filter).reduce((sum, s) => sum + s.people(c), 0);
}
