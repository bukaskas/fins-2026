import { BookingStatus } from "@prisma/client";

import { SERVER_URL } from "@/lib/constants";
import { serviceLabel } from "@/lib/bookings/status";

/**
 * The messages reception actually sends a guest, rendered with that booking's
 * real values so the desk can send rather than compose.
 *
 * The deposit and Instagram texts are the copy already in use on the bookings
 * list row (components/kitesurfing/BookingComponent.tsx); the rest follow the
 * same voice and state only facts the product already holds. Nothing here
 * invents a policy, a price, an opening hour, or a promise.
 */

/** Strip formatting, then put an Egyptian local number into wa.me form. */
export function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
}

/** `tel:` keeps a leading + when the stored number had one. */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${phone.trim().startsWith("+") ? `+${digits}` : digits}`;
}

export function bookingUrl(bookingId: string): string {
  return `${SERVER_URL}/bookings/${bookingId}`;
}

export function whatsappHref(phone: string, text: string): string {
  return `https://wa.me/${whatsappDigits(phone)}?text=${encodeURIComponent(text)}`;
}

const egp = new Intl.NumberFormat("en-EG");

function money(cents: number): string {
  return `${egp.format(Math.round(cents / 100))} EGP`;
}

export type BookingMessage = {
  id: string;
  /** Button label — names the action, not the template. */
  label: string;
  /** One line on when this is the right thing to send. */
  when: string;
  body: string;
  /** Surfaced first for the booking's current status. */
  suggested: boolean;
};

export type MessageBookingInput = {
  id: string;
  name: string;
  service: string;
  date: Date;
  time: string | null;
  bookingStatus: BookingStatus;
  numberOfPeople: number;
  numberOfKids: number;
  totalPriceCents: number | null;
  amountPaidCents: number;
  paymentLink: string | null;
};

function partyLine(adults: number, kids: number): string {
  const people = `${adults} ${adults === 1 ? "adult" : "adults"}`;
  return kids > 0 ? `${people} and ${kids} ${kids === 1 ? "kid" : "kids"}` : people;
}

function dateLine(date: Date, time: string | null): string {
  const day = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return time ? `${day} at ${time}` : day;
}

/**
 * Build every message for this booking, with the ones that fit its current
 * status marked `suggested` so the desk sees the right one first.
 */
export function buildBookingMessages(b: MessageBookingInput): BookingMessage[] {
  const url = bookingUrl(b.id);
  const total = b.totalPriceCents ?? 0;
  const balance = Math.max(0, total - b.amountPaidCents);
  const status = b.bookingStatus;

  const messages: BookingMessage[] = [
    {
      id: "deposit",
      label: "Ask for the deposit",
      when: "The guest needs to pay to hold the booking.",
      suggested:
        status === BookingStatus.WAITING_PAYMENT ||
        status === BookingStatus.UNDER_REVIEW,
      body:
        `Hello ${b.name},\n` +
        `To confirm your booking, please follow this link to complete your deposit payment: ${url}\n` +
        `Thank you! 🪁 The Fins Team`,
    },
    {
      id: "reminder",
      label: "Chase the payment",
      when: "The hold is running out and nothing has arrived yet.",
      suggested: status === BookingStatus.WAITING_PAYMENT && b.amountPaidCents === 0,
      body:
        `Hello ${b.name},\n` +
        `Just a reminder about your ${serviceLabel(b.service).toLowerCase()} booking on ${dateLine(b.date, b.time)}.\n` +
        (balance > 0 ? `There is still ${money(balance)} to pay to confirm it.\n` : "") +
        `You can pay here: ${url}\n` +
        `Let us know if you have any trouble with the link.\n` +
        `The Fins Team`,
    },
    {
      id: "instagram",
      label: "Ask for Instagram",
      when: "A first-time booking still needs to be vetted.",
      suggested: status === BookingStatus.PENDING || status === BookingStatus.REQUEST_SENT,
      body:
        `Hello,\n` +
        `Thank you for booking with Fins Kitesurfing & Beach Club! We're excited to have you with us.\n` +
        `To complete your first booking, could you please share your Instagram account?\n` +
        `You can track the status of your booking anytime here: ${url}\n` +
        `Looking forward to seeing you on the water! 🪁\n` +
        `The Fins Team`,
    },
    {
      id: "confirmed",
      label: "Confirm the booking",
      when: "Payment has landed and the guest should be told.",
      suggested: status === BookingStatus.CONFIRMED,
      body:
        `Hello ${b.name},\n` +
        `Your ${serviceLabel(b.service).toLowerCase()} booking is confirmed for ${dateLine(b.date, b.time)}, for ${partyLine(b.numberOfPeople, b.numberOfKids)}.\n` +
        (balance > 0 ? `There is ${money(balance)} left to settle on arrival.\n` : "") +
        `Everything about your booking is here: ${url}\n` +
        `See you soon! 🪁 The Fins Team`,
    },
    {
      id: "details",
      label: "Send the booking details",
      when: "The guest wants to check what is booked.",
      suggested: false,
      body:
        `Hello ${b.name},\n` +
        `Here are your booking details:\n` +
        `${serviceLabel(b.service)} — ${dateLine(b.date, b.time)}\n` +
        `${partyLine(b.numberOfPeople, b.numberOfKids)}\n` +
        (total > 0 ? `Total ${money(total)}, paid ${money(b.amountPaidCents)}, remaining ${money(balance)}\n` : "") +
        `Your booking page: ${url}\n` +
        `The Fins Team`,
    },
  ];

  return [...messages.filter((m) => m.suggested), ...messages.filter((m) => !m.suggested)];
}
