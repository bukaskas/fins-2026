"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Link2, Loader2, ShieldCheck } from "lucide-react";

import { createBookingPaymentLink } from "@/lib/actions/booking.actions";
import { FOCUS_RING } from "@/lib/bookings/status";

/**
 * Guest-facing payment CTA, shown on the booking page while the booking is
 * awaiting payment. Two steps on purpose: "Generate payment link" starts the
 * guest's 24h to pay (the page then shows the countdown), and only then does
 * "Pay deposit online" go to the Flash checkout. A link that has lapsed or was
 * voided is re-issued on click under the same deadline.
 */
export default function PayDepositOnline({
  bookingId,
  paymentLink,
  paymentLinkExpiresAt = null,
  paysInFull = false,
}: {
  bookingId: string;
  /** This payment window's link, or null if the guest hasn't generated one. */
  paymentLink: string | null;
  paymentLinkExpiresAt?: string | null;
  paysInFull?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [link, setLink] = React.useState(paymentLink);
  React.useEffect(() => setLink(paymentLink), [paymentLink]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await createBookingPaymentLink(bookingId);
      if (res.success && res.paymentLink) {
        setLink(res.paymentLink);
        toast.success("Payment link ready. You have until the deadline below to pay.");
        router.refresh();
      } else {
        toast.error(res.message ?? "Couldn't create the payment link. Please try again.");
      }
    } catch {
      toast.error("Couldn't create the payment link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    // Read the clock on click, never during render: a live/expired split
    // computed while rendering would differ between server and client and
    // hydrate wrong.
    const linkIsLive =
      link &&
      (link !== paymentLink ||
        !paymentLinkExpiresAt ||
        new Date(paymentLinkExpiresAt).getTime() > Date.now());
    if (linkIsLive) {
      window.location.href = link;
      return;
    }
    setLoading(true);
    try {
      const res = await createBookingPaymentLink(bookingId);
      if (res.success && res.paymentLink) {
        window.location.href = res.paymentLink;
      } else {
        toast.error(res.message ?? "Couldn't start the payment. Please try again.");
        setLoading(false);
      }
    } catch {
      toast.error("Couldn't start the payment. Please try again.");
      setLoading(false);
    }
  };

  const label = link
    ? loading
      ? "Preparing secure checkout…"
      : paysInFull
        ? "Pay online"
        : "Pay deposit online"
    : loading
      ? "Generating your link…"
      : "Generate payment link";
  const Icon = link ? CreditCard : Link2;

  return (
    <div>
      <button
        type="button"
        onClick={link ? pay : generate}
        disabled={loading}
        aria-busy={loading}
        aria-describedby={`secure-payment-note-${bookingId}`}
        className={`group flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#1a1614] px-6 py-4 text-white transition-colors duration-150 hover:bg-[#2a2522] disabled:cursor-wait disabled:opacity-70 shadow-[0_12px_30px_-12px_rgba(26,22,20,0.55)] ${FOCUS_RING}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        )}
        <span
          aria-live="polite"
          className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.16em] uppercase font-[600]"
        >
          {label}
        </span>
      </button>
      <div
        id={`secure-payment-note-${bookingId}`}
        className="mt-3 flex items-center justify-center gap-1.5 text-[#6b6460]"
      >
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
        <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[400]">
          Secure card payment · powered by Flash
        </span>
      </div>
    </div>
  );
}
