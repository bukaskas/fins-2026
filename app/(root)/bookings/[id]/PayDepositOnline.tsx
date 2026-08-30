"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

import { createBookingPaymentLink } from "@/lib/actions/booking.actions";
import { FOCUS_RING } from "@/lib/bookings/status";

/**
 * Guest-facing "pay the 50% deposit online" CTA shown on the booking page while
 * the booking is awaiting payment. If a Flash link already exists we open it
 * directly; otherwise we create one on click, then redirect to the checkout.
 */
export default function PayDepositOnline({
  bookingId,
  paymentLink,
}: {
  bookingId: string;
  paymentLink: string | null;
}) {
  const [loading, setLoading] = React.useState(false);

  const handlePay = async () => {
    if (paymentLink) {
      window.location.href = paymentLink;
      return;
    }
    setLoading(true);
    try {
      const res = await createBookingPaymentLink(bookingId);
      if (res.success && res.paymentLink) {
        window.location.href = res.paymentLink;
      } else {
        toast.error(
          res.message ?? "Couldn't start the payment. Please try again.",
        );
        setLoading(false);
      }
    } catch {
      toast.error("Couldn't start the payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        aria-busy={loading}
        aria-describedby={`secure-payment-note-${bookingId}`}
        className={`group flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#1a1614] px-6 py-4 text-white transition-colors duration-150 hover:bg-[#2a2522] disabled:cursor-wait disabled:opacity-70 shadow-[0_12px_30px_-12px_rgba(26,22,20,0.55)] ${FOCUS_RING}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <CreditCard className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        )}
        <span
          aria-live="polite"
          className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.16em] uppercase font-[600]"
        >
          {loading ? "Preparing secure checkout…" : "Pay deposit online"}
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
