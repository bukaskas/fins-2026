"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

import { createBookingPaymentLink } from "@/lib/actions/booking.actions";

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
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1a1614] px-6 py-4 text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-[#2a2522] active:scale-[0.99] disabled:opacity-70 disabled:hover:translate-y-0 shadow-[0_12px_30px_-12px_rgba(26,22,20,0.55)]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <CreditCard className="h-4 w-4" strokeWidth={1.6} />
        )}
        <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.2em] uppercase font-[600]">
          {loading ? "Preparing secure checkout…" : "Pay deposit online"}
        </span>
      </button>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[#6b6460]">
        <ShieldCheck className="h-3 w-3" strokeWidth={1.6} />
        <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] sm:text-[0.7rem] font-[400]">
          Secure card payment · powered by Flash
        </span>
      </div>
    </div>
  );
}
