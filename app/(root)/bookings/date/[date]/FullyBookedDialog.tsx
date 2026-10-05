"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { sendFullyBookedEmails } from "@/lib/actions/booking.actions";
import { FOCUS_RING } from "@/lib/bookings/status";

type Props = {
  date: string;
  dateLabel: string;
  pendingCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes on close when the opener has unmounted (a menu item). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * Confirmation for the bulk "fully booked" email, which cancels every
 * emailed PENDING booking. Controlled, with no trigger
 * of its own, so both the inline header button and the mobile actions menu can
 * open the same dialog.
 */
export function FullyBookedDialog({
  date,
  dateLabel,
  pendingCount,
  open,
  onOpenChange,
  returnFocusRef,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onConfirm = async () => {
    setIsSubmitting(true);
    const res = await sendFullyBookedEmails(date);
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.message ?? "Couldn’t send the fully booked emails.");
      return;
    }

    // Only emailed bookings are canceled; everyone else is still pending.
    const parts = [`Emailed ${res.sent}`, `canceled ${res.canceled}`];
    if (res.skippedNoEmail) {
      parts.push(`${res.skippedNoEmail} skipped (no email, still pending)`);
    }
    if (res.failed) parts.push(`${res.failed} failed (still pending)`);
    // Anything left pending is a follow-up for staff, so it isn't a plain success.
    const leftPending = (res.skippedNoEmail ?? 0) + (res.failed ?? 0) > 0;
    (leftPending ? toast.warning : toast.success)(parts.join(" · "));
    onOpenChange(false);
    router.refresh();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => {
            if (!returnFocusRef?.current) return;
            e.preventDefault();
            returnFocusRef.current.focus();
          }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <div
            className="relative overflow-hidden rounded-[28px] ring-1 ring-white/60"
            style={{
              background: "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
              boxShadow:
                "0 30px 80px -20px rgba(40, 32, 24, 0.35), 0 8px 24px -8px rgba(40, 32, 24, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            }}
          >
            <div className="relative px-7 pt-7 pb-6">
              <DialogPrimitive.Title className="font-[family-name:var(--font-raleway)] text-[1.4rem] font-[200] tracking-[-0.01em] text-[#1a1614] leading-tight">
                Cancel {pendingCount} new {pendingCount === 1 ? "request" : "requests"}?
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] text-[#5b5650] leading-[1.6]">
                Each guest with a new request on{" "}
                <span className="text-[#1a1614] font-[600]">{dateLabel}</span> gets a “fully
                booked” email, and their booking is marked{" "}
                <span className="text-[#1a1614] font-[600]">Canceled</span>. This can’t be
                undone. Requests with no email on file stay pending, so contact those guests
                yourself.
              </DialogPrimitive.Description>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className={`h-11 rounded-full ${FOCUS_RING} bg-white/60 backdrop-blur-sm border border-[#ece8e3] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[600] text-[#5b5650] transition-all duration-150 hover:bg-white hover:border-[#d6d0c8] active:scale-[0.985] disabled:opacity-40`}
                  >
                    Keep them
                  </button>
                </DialogPrimitive.Close>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className={`h-11 rounded-full ${FOCUS_RING} bg-[#b91c1c] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(185,28,28,0.45)] transition-all duration-150 hover:bg-[#991b1b] active:scale-[0.985] disabled:opacity-50`}
                >
                  {isSubmitting ? "Emailing…" : "Email & cancel"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
