"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingContactChannel, BookingContactOutcome } from "@prisma/client";
import { Check, ChevronDown, Copy, Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { logBookingContact } from "@/lib/actions/booking.actions";
import { instagramHref } from "@/lib/utils";
import type { BookingMessage } from "@/lib/bookings/messages";
import { telHref, whatsappHref } from "@/lib/bookings/messages";
import { FOCUS_RING, MUTED } from "@/lib/bookings/status";

/**
 * The desk's primary surface: what to say to this guest next, already written
 * with their name and their amounts in it. Sending records a contact against
 * the booking, so the log below stops being empty.
 */

/** Clipboard with a fallback for the non-secure contexts phones land in. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function MessageDeck({
  bookingId,
  phone,
  email,
  instagram,
  messages,
}: {
  bookingId: string;
  phone: string;
  email: string | null;
  instagram: string | null;
  messages: BookingMessage[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const record = (channel: BookingContactChannel) => {
    startTransition(async () => {
      const res = await logBookingContact(
        bookingId,
        channel,
        BookingContactOutcome.ATTEMPTED,
      );
      if (res.success) router.refresh();
    });
  };

  const onCopy = async (m: BookingMessage) => {
    const ok = await copyText(m.body);
    if (ok) {
      setCopiedId(m.id);
      window.setTimeout(() => setCopiedId(null), 2000);
      toast.success("Message copied");
    } else {
      toast.error("Could not copy. Open the message and select the text.");
    }
  };

  return (
    <section aria-labelledby="message-deck-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="message-deck-heading"
          className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
          style={{ color: MUTED }}
        >
          Send the next message
        </h2>

        {/* contact rail — every channel we hold for this guest */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={telHref(phone)}
            onClick={() => record(BookingContactChannel.CALL)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ece8e3] bg-white px-3.5 text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
          >
            <Phone className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
            <span className="font-[family-name:var(--font-roboto-mono)] text-[0.78rem] tabular-nums">
              {phone}
            </span>
          </a>

          {email && (
            <a
              href={`mailto:${email}`}
              onClick={() => record(BookingContactChannel.EMAIL)}
              aria-label={`Email ${email}`}
              className={`inline-flex size-11 items-center justify-center rounded-full border border-[#ece8e3] bg-white text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <Mail className="size-4" strokeWidth={1.7} aria-hidden="true" />
            </a>
          )}

          {instagram && (
            <a
              href={instagramHref(instagram)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open Instagram ${instagram}`}
              className={`inline-flex size-11 items-center justify-center rounded-full border border-[#ece8e3] bg-white text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <Instagram className="size-4" strokeWidth={1.7} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-2.5">
        {messages.map((m) => {
          const open = openId === m.id;
          return (
            <li
              key={m.id}
              className="overflow-hidden rounded-2xl border border-[#ece8e3] bg-white shadow-[0_1px_6px_rgba(26,22,20,0.08)]"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
                className={`flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#faf9f7] ${FOCUS_RING}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-raleway)] text-[0.92rem] font-[600] text-[#1a1614]">
                      {m.label}
                    </span>
                    {m.suggested && (
                      <span className="rounded-full bg-[#e2f0e6] px-2 py-0.5 font-[family-name:var(--font-raleway)] text-[0.68rem] font-[700] uppercase tracking-[0.12em] text-[#15803d]">
                        Suggested
                      </span>
                    )}
                  </span>
                  <span
                    className="mt-0.5 block font-[family-name:var(--font-raleway)] text-[0.8rem]"
                    style={{ color: MUTED }}
                  >
                    {m.when}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  strokeWidth={1.7}
                  style={{ color: MUTED }}
                  aria-hidden="true"
                />
              </button>

              {open && (
                <div className="border-t border-[#ece8e3] px-4 pb-4 pt-3">
                  <p className="whitespace-pre-wrap font-[family-name:var(--font-raleway)] text-[0.86rem] leading-relaxed text-[#3a3531]">
                    {m.body}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={whatsappHref(phone, m.body)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => record(BookingContactChannel.WHATSAPP)}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] px-5 text-white transition-colors hover:bg-[#2a2522] ${FOCUS_RING}`}
                    >
                      <MessageCircle className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em]">
                        Send on WhatsApp
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onCopy(m)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-5 text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
                    >
                      {copiedId === m.id ? (
                        <Check className="size-4 text-[#15803d]" strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      )}
                      <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em]">
                        {copiedId === m.id ? "Copied" : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
