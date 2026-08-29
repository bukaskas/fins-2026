import { BookingContactChannel, BookingContactOutcome } from "@prisma/client";
import { Mail, MessageCircle, Phone, Radio } from "lucide-react";

import { MUTED } from "@/lib/bookings/status";

/**
 * Who has already spoken to this guest, and how.
 *
 * `BookingContact` has been in the schema all along; nothing on the booking
 * page ever showed it, so the desk had no way to know whether a colleague had
 * already called. The message deck writes to it on every send.
 */

const CHANNEL_ICON = {
  [BookingContactChannel.CALL]: Phone,
  [BookingContactChannel.WHATSAPP]: MessageCircle,
  [BookingContactChannel.EMAIL]: Mail,
  [BookingContactChannel.OTHER]: Radio,
} as const;

const CHANNEL_LABEL: Record<BookingContactChannel, string> = {
  CALL: "Called",
  WHATSAPP: "WhatsApp",
  EMAIL: "Emailed",
  OTHER: "Contacted",
};

const OUTCOME_LABEL: Record<BookingContactOutcome, string> = {
  ATTEMPTED: "attempted",
  REACHED: "reached",
  NO_RESPONSE: "no response",
  FOLLOW_UP: "follow up",
};

export type ContactEntry = {
  id: string;
  channel: BookingContactChannel;
  outcome: BookingContactOutcome;
  createdAt: string;
  actor: string | null;
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactLog({
  contacts,
  createdAt,
}: {
  contacts: ContactEntry[];
  createdAt: string;
}) {
  return (
    <section aria-labelledby="contact-log-heading" className="mt-6">
      <h2
        id="contact-log-heading"
        className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
        style={{ color: MUTED }}
      >
        History
      </h2>

      <ol className="mt-3 space-y-0">
        {contacts.map((c) => {
          const Icon = CHANNEL_ICON[c.channel] ?? Radio;
          return (
            <li key={c.id} className="flex gap-3 py-2.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#ece8e3] bg-white">
                <Icon className="size-3.5" strokeWidth={1.7} style={{ color: MUTED }} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-[family-name:var(--font-raleway)] text-[0.86rem] text-[#1a1614]">
                  {CHANNEL_LABEL[c.channel]}
                  <span style={{ color: MUTED }}> · {OUTCOME_LABEL[c.outcome]}</span>
                </span>
                <span
                  className="mt-0.5 block font-[family-name:var(--font-raleway)] text-[0.78rem]"
                  style={{ color: MUTED }}
                >
                  {c.actor ?? "Unknown"}
                  <span className="mx-1.5 text-[#d6d0c8]">·</span>
                  <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums">
                    {when(c.createdAt)}
                  </span>
                </span>
              </span>
            </li>
          );
        })}

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
      </ol>

      {contacts.length === 0 && (
        <p
          className="mt-1 font-[family-name:var(--font-raleway)] text-[0.8rem]"
          style={{ color: MUTED }}
        >
          No one has contacted this guest from the desk yet. Sending a message
          above records it here.
        </p>
      )}
    </section>
  );
}
