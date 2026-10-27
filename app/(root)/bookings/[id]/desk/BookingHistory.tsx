import {
  BookingContactChannel,
  BookingContactOutcome,
  BookingEventSource,
  BookingStatus,
  PaymentMethod,
} from "@prisma/client";
import {
  ArrowRight,
  Banknote,
  Mail,
  MessageCircle,
  Phone,
  Radio,
  Reply,
} from "lucide-react";

import { type FollowUp, MAX_ATTEMPTS } from "@/lib/bookings/follow-up";
import { formatPaymentDeadlineShort } from "@/lib/bookings/payment-window";
import { MUTED, STATUS_LABEL } from "@/lib/bookings/status";
import { formatEGPAmount } from "@/lib/pricing";

/**
 * Everything that has happened to this booking, newest first: status changes
 * (`BookingEvent`), every message and call (`BookingContact`) and payments
 * (`BookingPayment`), with the follow-up rule's verdict on top. One list, so
 * the desk can answer "who spoke to this guest, when, and what now" without
 * piecing it together.
 */

const CHANNEL_ICON = {
  [BookingContactChannel.CALL]: Phone,
  [BookingContactChannel.WHATSAPP]: MessageCircle,
  [BookingContactChannel.EMAIL]: Mail,
  [BookingContactChannel.OTHER]: Radio,
} as const;

const CHANNEL_LABEL: Record<BookingContactChannel, string> = {
  CALL: "Called",
  WHATSAPP: "WhatsApp sent",
  EMAIL: "Emailed",
  OTHER: "Contacted",
};

const OUTCOME_LABEL: Record<BookingContactOutcome, string | null> = {
  ATTEMPTED: null,
  REACHED: null,
  NO_RESPONSE: "no answer",
  FOLLOW_UP: "follow up",
};

const SOURCE_LABEL: Record<BookingEventSource, string> = {
  STAFF: "Staff",
  GUEST: "Guest",
  PAYMENT: "Payment",
  CRON: "Automatic",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "cash",
  CARD: "card",
  VISA: "Visa",
  TRANSFER: "transfer",
  DISCOUNT: "discount",
  EURO: "euro",
  USD: "USD",
};

export type HistoryContact = {
  id: string;
  channel: BookingContactChannel;
  outcome: BookingContactOutcome;
  createdAt: Date;
  actor: string | null;
};

export type HistoryEvent = {
  id: string;
  source: BookingEventSource;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus | null;
  createdAt: Date;
  actor: string | null;
};

export type HistoryPayment = {
  id: string;
  amountCents: number;
  method: PaymentMethod;
  online: boolean;
  createdAt: Date;
};

type Entry = {
  id: string;
  at: Date;
  icon: typeof Phone;
  title: string;
  detail: string | null;
  tone?: "reply";
};

function when(d: Date): string {
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  });
}

function entries(
  contacts: HistoryContact[],
  events: HistoryEvent[],
  payments: HistoryPayment[],
): Entry[] {
  const list: Entry[] = [
    ...contacts.map((c): Entry => {
      if (c.outcome === BookingContactOutcome.REACHED) {
        return {
          id: c.id,
          at: c.createdAt,
          icon: Reply,
          title: "Guest replied",
          detail: c.actor ? `Logged by ${c.actor}` : null,
          tone: "reply",
        };
      }
      const outcome = OUTCOME_LABEL[c.outcome];
      return {
        id: c.id,
        at: c.createdAt,
        icon: CHANNEL_ICON[c.channel] ?? Radio,
        title: outcome ? `${CHANNEL_LABEL[c.channel]} · ${outcome}` : CHANNEL_LABEL[c.channel],
        detail: c.actor ?? "Unknown",
      };
    }),
    // Owner reassignments carry no status; the summary band shows the owner.
    ...events
      .filter((e) => e.toStatus)
      .map((e): Entry => ({
        id: e.id,
        at: e.createdAt,
        icon: ArrowRight,
        title: e.fromStatus
          ? `${STATUS_LABEL[e.fromStatus]} → ${STATUS_LABEL[e.toStatus!]}`
          : `Booked as ${STATUS_LABEL[e.toStatus!]}`,
        detail: e.actor ?? SOURCE_LABEL[e.source],
      })),
    ...payments.map((p): Entry => ({
      id: p.id,
      at: p.createdAt,
      icon: Banknote,
      title: `Paid ${formatEGPAmount(p.amountCents)} EGP`,
      detail: p.online ? "Online" : METHOD_LABEL[p.method],
    })),
  ];
  return list.sort((a, b) => b.at.getTime() - a.at.getTime());
}

function followUpLine(f: FollowUp): { text: string; urgent: boolean } | null {
  switch (f.stage) {
    case "not_contacted":
      return { text: "Not contacted yet — message or call the guest.", urgent: true };
    case "waiting":
      return {
        text: `Waiting on the guest · follow up ${formatPaymentDeadlineShort(f.dueAt!)} · attempt ${f.attempts} of ${MAX_ATTEMPTS}`,
        urgent: false,
      };
    case "due":
      return {
        text: `Follow-up due since ${formatPaymentDeadlineShort(f.dueAt!)} · attempt ${f.attempts} of ${MAX_ATTEMPTS} sent`,
        urgent: true,
      };
    case "flagged":
      return {
        text: `No reply after ${f.attempts} attempts — decide: one more try, decline, or no response.`,
        urgent: true,
      };
    case "replied":
      return { text: "The guest replied — the next step is yours.", urgent: false };
    default:
      return null;
  }
}

export default function BookingHistory({
  contacts,
  events,
  payments,
  createdAt,
  followUp,
}: {
  contacts: HistoryContact[];
  events: HistoryEvent[];
  payments: HistoryPayment[];
  createdAt: Date;
  followUp: FollowUp;
}) {
  const list = entries(contacts, events, payments);
  const line = followUpLine(followUp);
  // Bookings from before status history began have no "booked" event.
  const hasCreationEvent = events.some((e) => e.toStatus && !e.fromStatus);

  return (
    <section aria-labelledby="booking-history-heading" className="mt-6">
      <h2
        id="booking-history-heading"
        className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
        style={{ color: MUTED }}
      >
        History
      </h2>

      {line && (
        <p
          className={`mt-3 rounded-xl border px-3 py-2.5 font-[family-name:var(--font-raleway)] text-[0.84rem] ${
            line.urgent
              ? "border-[#f3c9c9] bg-[#fdf1f1] text-[#991b1b]"
              : "border-[#ece8e3] bg-white text-[#1a1614]"
          }`}
        >
          {line.text}
        </p>
      )}

      <ol className="mt-3 space-y-0">
        {list.map((e) => {
          const Icon = e.icon;
          return (
            <li key={e.id} className="flex gap-3 py-2.5">
              <span
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                  e.tone === "reply"
                    ? "border-[#bfddc8] bg-[#e2f0e6]"
                    : "border-[#ece8e3] bg-white"
                }`}
              >
                <Icon
                  className="size-3.5"
                  strokeWidth={1.7}
                  style={{ color: e.tone === "reply" ? "#15803d" : MUTED }}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-[family-name:var(--font-raleway)] text-[0.86rem] text-[#1a1614]">
                  {e.title}
                </span>
                <span
                  className="mt-0.5 block font-[family-name:var(--font-raleway)] text-[0.78rem]"
                  style={{ color: MUTED }}
                >
                  {e.detail && (
                    <>
                      {e.detail}
                      <span className="mx-1.5 text-[#d6d0c8]">·</span>
                    </>
                  )}
                  <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums">
                    {when(e.at)}
                  </span>
                </span>
              </span>
            </li>
          );
        })}

        {!hasCreationEvent && (
          <li className="flex gap-3 py-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#ece8e3] bg-white">
              <span className="size-1.5 rounded-full" style={{ background: MUTED }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-[family-name:var(--font-raleway)] text-[0.86rem] text-[#1a1614]">
                Booking created
              </span>
              <span
                className="mt-0.5 block font-[family-name:var(--font-roboto-mono)] text-[0.78rem] tabular-nums"
                style={{ color: MUTED }}
              >
                {when(createdAt)}
              </span>
            </span>
          </li>
        )}
      </ol>
    </section>
  );
}
