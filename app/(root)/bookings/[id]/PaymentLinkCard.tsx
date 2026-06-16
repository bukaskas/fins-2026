"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Link2, RefreshCw } from "lucide-react";

import { CopyButton } from "./CopyButton";
import {
  createBookingPaymentLink,
  checkBookingPaymentStatus,
} from "@/lib/actions/booking.actions";

export default function PaymentLinkCard({
  bookingId,
  paymentLink,
}: {
  bookingId: string;
  paymentLink: string | null;
}) {
  const router = useRouter();
  const [creating, startCreate] = React.useTransition();
  const [checking, startCheck] = React.useTransition();

  const generate = () => {
    startCreate(async () => {
      const res = await createBookingPaymentLink(bookingId);
      if (res.success) {
        toast.success("Payment link ready");
        router.refresh();
      } else {
        toast.error(res.message ?? "Couldn't create payment link");
      }
    });
  };

  const checkStatus = () => {
    startCheck(async () => {
      const res = await checkBookingPaymentStatus(bookingId);
      if (!res.success) {
        toast.error(res.message ?? "Couldn't check payment status");
        return;
      }
      if (res.confirmed) {
        toast.success("Payment confirmed — booking updated");
        router.refresh();
      } else {
        toast.info(`Not paid yet (status: ${res.status})`);
      }
    });
  };

  return (
    <div className="col-span-2 pt-6 border-t border-[#ece8e3]">
      <div className="mb-3 font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.22em] uppercase font-[600] text-[#b0a89f]">
        Payment link
      </div>

      {paymentLink ? (
        <div className="space-y-3">
          <CopyButton value={paymentLink} toastLabel="Payment link copied" />
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#5b5650] hover:text-[#1a1614] transition-colors font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.06em]"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.5} />
              Open payment page
            </a>
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              className="inline-flex items-center gap-2 text-[#5b5650] hover:text-[#1a1614] transition-colors font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.06em] disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3.5 ${checking ? "animate-spin" : ""}`}
                strokeWidth={1.5}
              />
              {checking ? "Checking…" : "Check payment status"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a1614] px-5 py-2.5 text-white font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.18em] uppercase font-[600] transition-all hover:-translate-y-px hover:bg-[#2a2522] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <Link2 className="size-3.5" strokeWidth={1.5} />
          {creating ? "Creating…" : "Generate payment link"}
        </button>
      )}
    </div>
  );
}
