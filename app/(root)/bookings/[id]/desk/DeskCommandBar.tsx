"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookingContactChannel,
  BookingContactOutcome,
  BookingStatus,
} from "@prisma/client";
import { Loader2, MessageCircle, Phone, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  logBookingContact,
  updateBookingStatus,
} from "@/lib/actions/booking.actions";
import { telHref, whatsappHref } from "@/lib/bookings/messages";
import { FOCUS_RING } from "@/lib/bookings/status";

/**
 * Fixed thumb-zone bar. One row only — the bookings brief forbids pinning a
 * tall stacked toolbar on a phone, and this is the half of the split command
 * bar that has to stay reachable while the rest of the page scrolls.
 *
 * Check-in gets its own button because marking a guest ARRIVED is the most
 * frequent desk action of the season; every other status change stays behind
 * the status pill in the header.
 */
export default function DeskCommandBar({
  bookingId,
  bookingStatus,
  guestName,
  phone,
  primaryMessage,
}: {
  bookingId: string;
  bookingStatus: BookingStatus;
  guestName: string;
  phone: string;
  primaryMessage: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canCheckIn = bookingStatus === BookingStatus.CONFIRMED;

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

  const checkIn = () => {
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, BookingStatus.ARRIVED);
      if (res.success) {
        toast.success(`${guestName} checked in`);
        if ("warning" in res && res.warning) toast.warning(String(res.warning));
        router.refresh();
      } else {
        toast.error(
          ("message" in res && res.message) || "Could not check the guest in.",
        );
      }
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ece8e3] bg-white/95 backdrop-blur-sm">
      <div
        className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href={telHref(phone)}
          onClick={() => record(BookingContactChannel.CALL)}
          aria-label={`Call ${guestName}`}
          className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-[#ece8e3] text-[#3a3531] transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] ${FOCUS_RING}`}
        >
          <Phone className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </a>

        <a
          href={whatsappHref(phone, primaryMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => record(BookingContactChannel.WHATSAPP)}
          className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] px-4 text-white transition-colors hover:bg-[#2a2522] ${FOCUS_RING}`}
        >
          <MessageCircle className="size-5" strokeWidth={1.7} aria-hidden="true" />
          <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em]">
            Message
          </span>
        </a>

        {canCheckIn && (
          <button
            type="button"
            onClick={checkIn}
            disabled={isPending}
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-[#bfddc8] bg-[#e2f0e6] px-4 text-[#15803d] transition-colors hover:bg-[#d6e9dc] disabled:opacity-60 ${FOCUS_RING}`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <UserCheck className="size-5" strokeWidth={1.7} aria-hidden="true" />
            )}
            <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em]">
              Check in
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
