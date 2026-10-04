"use client";

import { ArrowUpRight, Check, Copy, Instagram, MessageCircle } from "lucide-react";

import { INSTAGRAM_DM_URL, WHATSAPP_PHONE } from "@/lib/constants";
import { whatsappHref } from "@/lib/bookings/messages";
import { FOCUS_RING } from "@/lib/bookings/status";
import { useCopy } from "./useCopy";

/**
 * The guest's way to ask the desk about this booking: one copied message that
 * carries the link and the details, then a hop to WhatsApp (pre-filled) or
 * Instagram (paste — DMs can't be pre-filled).
 */
export default function AskStaffCard({
  message,
  closed,
}: {
  message: string;
  /** Declined / canceled / expired — the guest is asking about it, not chasing it. */
  closed: boolean;
}) {
  const { copied, copy } = useCopy("Booking details copied");

  return (
    <section aria-labelledby="ask-staff-heading" className="my-8">
      <div className="rounded-2xl border border-[#ece8e3] bg-white/70 px-6 py-6 shadow-[0_8px_24px_-16px_rgba(40,32,24,0.22)] backdrop-blur-sm md:px-8">
        <h2
          id="ask-staff-heading"
          className="font-[family-name:var(--font-raleway)] text-[1.25rem] font-[400] leading-[1.2] tracking-[-0.01em] text-[#1a1614]"
        >
          {closed ? "Want to ask about this booking?" : "Questions about your booking?"}
        </h2>
        <p className="mt-2 max-w-[34rem] font-[family-name:var(--font-raleway)] text-[0.88rem] font-[400] leading-[1.55] text-[#5b5650]">
          Copy your booking details and send them to us &mdash; we&rsquo;ll find
          your reservation straight away.
        </p>

        <button
          type="button"
          onClick={() => copy(message)}
          className={`group mt-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#1a1614] px-5 py-3.5 text-white shadow-[0_8px_24px_-10px_rgba(26,22,20,0.5)] transition-colors duration-150 hover:bg-[#2a2522] sm:w-auto ${FOCUS_RING}`}
        >
          {copied ? (
            <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[600] uppercase tracking-[0.16em]">
            {copied ? "Copied" : "Copy booking details"}
          </span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Booking details copied" : ""}
        </span>

        <div className="mt-3 flex flex-wrap gap-2">
          <ChannelLink href={whatsappHref(WHATSAPP_PHONE, message)} icon={MessageCircle}>
            Open WhatsApp
          </ChannelLink>
          <ChannelLink href={INSTAGRAM_DM_URL} icon={Instagram}>
            Open Instagram
          </ChannelLink>
        </div>
      </div>
    </section>
  );
}

function ChannelLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof MessageCircle;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ece8e3] bg-white/70 px-4 py-2 text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:bg-white ${FOCUS_RING}`}
    >
      <Icon className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
      <span className="font-[family-name:var(--font-raleway)] text-[0.82rem] font-[500]">
        {children}
      </span>
      <ArrowUpRight
        className="size-3 text-[#6b6460] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        strokeWidth={1.7}
        aria-hidden="true"
      />
    </a>
  );
}
