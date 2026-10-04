import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";

import { bookingUrl } from "@/lib/bookings/messages";
import { serviceLabel } from "@/lib/bookings/status";

/**
 * The message a guest copies from their booking page to ask the desk about it.
 * The inverse of ./messages.ts: guest → staff. It carries the link so the desk
 * lands on the booking in one tap, and the readable details so they often
 * don't need to. No money — the text gets forwarded around chats.
 */

/** Statuses where the booking is over and the guest is asking about it, not chasing it. */
const CLOSED_STATUSES: BookingStatus[] = [
  BookingStatus.DECLINED,
  BookingStatus.CANCELED,
  BookingStatus.NO_RESPONSE_EXPIRED,
];

/** ARRIVED: the guest is on the beach — nothing left to ask over chat. */
export function showsAskStaff(status: BookingStatus): boolean {
  return status !== BookingStatus.ARRIVED;
}

export function isClosedBooking(status: BookingStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

export type StatusMessageInput = {
  id: string;
  name: string;
  service: string;
  date: Date | string;
  time: string | null;
  numberOfPeople: number;
  numberOfKids: number;
  bookingStatus: BookingStatus;
};

export function buildStatusMessage(
  b: StatusMessageInput,
  /** The label the guest sees on the page, so both sides read the same word. */
  statusLabel: string,
): string {
  const ask = isClosedBooking(b.bookingStatus)
    ? "I have a question about this booking."
    : "Could you check the status of my booking?";

  const date = format(new Date(b.date), "EEE d MMM yyyy");
  const adults = `${b.numberOfPeople} ${b.numberOfPeople === 1 ? "adult" : "adults"}`;
  const kids =
    b.numberOfKids > 0
      ? `, ${b.numberOfKids} ${b.numberOfKids === 1 ? "kid" : "kids"}`
      : "";

  return [
    `Hi Fins! ${ask}`,
    `Name: ${b.name}`,
    `Service: ${serviceLabel(b.service)}`,
    `Date: ${date}${b.time ? `, ${b.time}` : ""}`,
    `Guests: ${adults}${kids}`,
    `Status: ${statusLabel}`,
    `Ref: #${b.id.slice(0, 8)}`,
    bookingUrl(b.id),
  ].join("\n");
}
