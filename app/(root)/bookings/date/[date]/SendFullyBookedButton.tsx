"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { sendFullyBookedEmails } from "@/lib/actions/booking.actions";

type Props = {
  date: string;
  dateLabel: string;
  pendingCount: number;
};

export function SendFullyBookedButton({ date, dateLabel, pendingCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const disabled = pendingCount === 0;

  const onConfirm = async () => {
    setIsSubmitting(true);
    const res = await sendFullyBookedEmails(date);
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.message ?? "Failed to send emails");
      return;
    }

    const parts = [`Sent ${res.sent}, declined ${res.sent}`];
    if (res.skippedNoEmail) parts.push(`${res.skippedNoEmail} skipped (no email)`);
    if (res.failed) parts.push(`${res.failed} failed`);
    toast.success(parts.join(" · "));
    setOpen(false);
    router.refresh();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? "No pending bookings on this date" : undefined}
          className="inline-flex items-center gap-2 border border-[#d6d0c8] text-[#5b5650] text-[0.72rem] font-[600] tracking-[0.14em] uppercase px-4 py-2.5 font-[family-name:var(--font-raleway)] transition-colors duration-200 hover:border-[#8a8480] hover:text-[#1a1614] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#d6d0c8] disabled:hover:text-[#5b5650]"
        >
          Fully booked
          <span className="tabular-nums text-[#b0a89f]">{pendingCount}</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[24rem] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
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
                Email pending guests?
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] text-[#5b5650] leading-[1.6]">
                This sends a “fully booked” email to{" "}
                <span className="text-[#1a1614] font-[600]">{pendingCount}</span>{" "}
                pending {pendingCount === 1 ? "booking" : "bookings"} on{" "}
                <span className="text-[#1a1614] font-[600]">{dateLabel}</span>, then marks{" "}
                {pendingCount === 1 ? "it" : "them"} as{" "}
                <span className="text-[#1a1614] font-[600]">Declined</span>. Guests with no email
                on file are skipped.
              </DialogPrimitive.Description>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="h-11 rounded-full bg-white/60 backdrop-blur-sm border border-[#ece8e3] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[600] text-[#5b5650] transition-all duration-150 hover:bg-white hover:border-[#d6d0c8] active:scale-[0.985] disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="h-11 rounded-full bg-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(26,22,20,0.45)] transition-all duration-150 hover:bg-[#2a2522] active:scale-[0.985] disabled:opacity-50"
                >
                  {isSubmitting ? "Sending…" : "Send & decline"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
