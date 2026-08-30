import { BookingStatus } from "@prisma/client";

/**
 * Canonical booking status + service tokens for the whole /bookings section.
 *
 * `.claude/design-system/pages/bookings.md` names these the source of truth:
 * saturated values drive dots, strips and tinted grounds; the darkened `TEXT`
 * pairs are the only ones allowed to colour label text (all ≥4.5:1 on white).
 * They lived privately inside BookingComponent, which is how the booking
 * detail page ended up inventing a second palette.
 */

/** Saturated — dots, left strips, tinted backgrounds. Never label text. */
export const STATUS_BORDER: Record<BookingStatus, string> = {
  PENDING:             "#f59e0b",
  REQUEST_SENT:        "#38bdf8",
  UNDER_REVIEW:        "#fb923c",
  WAITING_PAYMENT:     "#a78bfa",
  CONFIRMED:           "#22c55e",
  ARRIVED:             "#14b8a6",
  DECLINED:            "#ef4444",
  NO_RESPONSE_EXPIRED: "#9ca3af",
  CANCELED:            "#d1d5db",
};

/** Darkened pairs — the only values allowed to colour status text. */
export const STATUS_TEXT: Record<BookingStatus, string> = {
  PENDING:             "#b45309",
  REQUEST_SENT:        "#0369a1",
  UNDER_REVIEW:        "#c2410c",
  WAITING_PAYMENT:     "#6d28d9",
  CONFIRMED:           "#15803d",
  ARRIVED:             "#0f766e",
  DECLINED:            "#b91c1c",
  NO_RESPONSE_EXPIRED: "#4b5563",
  CANCELED:            "#6b7280",
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING:             "Pending",
  REQUEST_SENT:        "Request Sent",
  UNDER_REVIEW:        "Under Review",
  WAITING_PAYMENT:     "Waiting Payment",
  CONFIRMED:           "Confirmed",
  ARRIVED:             "Arrived",
  DECLINED:            "Declined",
  NO_RESPONSE_EXPIRED: "No Response",
  CANCELED:            "Canceled",
};

/** Muted foreground that clears 4.5:1 on white. `#b0a89f` is 2.3:1 — banned. */
export const MUTED = "#6b6460";

export const SERVICE_META: Record<string, { dot: string; text: string; label: string }> = {
  "kitesurfing-course": { dot: "#38bdf8", text: "#0369a1", label: "Kitesurfing" },
  "day-use":            { dot: "#fbbf24", text: "#b45309", label: "Day Use" },
  "restaurant":         { dot: "#fb923c", text: "#c2410c", label: "Restaurant" },
  "pharaoh-airstyle":   { dot: "#e879f9", text: "#a21caf", label: "Pharaoh" },
  "corporate":          { dot: "#a78bfa", text: "#6d28d9", label: "Corporate" },
};

export function serviceLabel(service: string): string {
  return SERVICE_META[service]?.label ?? service.replaceAll("-", " ");
}

/** Shared focus ring mandated by the bookings design brief. */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2";

/** Statuses grouped for the status picker, so destructive sits apart. */
export const STATUS_GROUPS: { label: string; statuses: BookingStatus[] }[] = [
  {
    label: "In progress",
    statuses: [
      BookingStatus.PENDING,
      BookingStatus.REQUEST_SENT,
      BookingStatus.UNDER_REVIEW,
      BookingStatus.WAITING_PAYMENT,
    ],
  },
  {
    label: "Guest is coming",
    statuses: [BookingStatus.CONFIRMED, BookingStatus.ARRIVED],
  },
  {
    label: "Closed",
    statuses: [
      BookingStatus.DECLINED,
      BookingStatus.NO_RESPONSE_EXPIRED,
      BookingStatus.CANCELED,
    ],
  },
];

/** Closing a booking is not undoable from the UI — these need a second tap. */
export const CLOSING_STATUSES: BookingStatus[] = [
  BookingStatus.DECLINED,
  BookingStatus.NO_RESPONSE_EXPIRED,
  BookingStatus.CANCELED,
];

/**
 * Transitions that start machinery, make a promise to the guest, or close the
 * booking. These always require an explicit second confirmation in staff UI.
 */
export const CONFIRMATION_STATUSES: BookingStatus[] = [
  BookingStatus.WAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  ...CLOSING_STATUSES,
];

/** What a status change actually triggers, shown before the user commits. */
export const STATUS_CONSEQUENCE: Partial<Record<BookingStatus, string>> = {
  WAITING_PAYMENT:
    "Mints a payment link and starts a 24-hour clock. The booking auto-cancels if it is not paid in time.",
  CONFIRMED:
    "Confirms the guest. At daily capacity this also closes the date for new bookings.",
  ARRIVED: "Marks the guest as checked in on the beach.",
  DECLINED: "Closes the booking. This cannot be undone from here.",
  NO_RESPONSE_EXPIRED: "Closes the booking. This cannot be undone from here.",
  CANCELED: "Closes the booking. This cannot be undone from here.",
};
