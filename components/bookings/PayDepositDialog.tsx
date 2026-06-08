"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";

import { payBookingDeposit } from "@/lib/actions/booking.actions";

type Props = {
  bookingId: string;
  totalPriceCents: number | null;
  amountPaidCents: number;
  /** Trigger node — used when the dialog manages its own open state. */
  trigger?: React.ReactNode;
  /** Controlled open state — used from a dropdown menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called after a successful deposit with the new cumulative paid amount. */
  onPaid?: (newAmountPaidCents: number) => void;
};

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Cash" },
  { value: PaymentMethod.CARD, label: "Card" },
  { value: PaymentMethod.TRANSFER, label: "Transfer" },
  { value: PaymentMethod.VISA, label: "Visa" },
];

function fmtEGP(cents: number): string {
  return new Intl.NumberFormat("en-EG").format(Math.round(cents / 100));
}

export default function PayDepositDialog({
  bookingId,
  totalPriceCents,
  amountPaidCents,
  trigger,
  open,
  onOpenChange,
  onPaid,
}: Props) {
  const router = useRouter();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [isControlled, onOpenChange],
  );

  const total = totalPriceCents ?? 0;
  const suggestedDeposit = Math.max(0, Math.round(total / 2) - amountPaidCents);

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAmount(suggestedDeposit > 0 ? String(suggestedDeposit / 100) : "");
      setMethod(PaymentMethod.CASH);
      setReference("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const remainingAfter = Math.max(0, total - (amountPaidCents + amountCents));

  const onSubmit = async () => {
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    setIsSubmitting(true);
    const res = await payBookingDeposit(bookingId, {
      amountCents,
      method,
      reference: reference.trim() || null,
    });
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Deposit recorded — booking confirmed");
      setOpen(false);
      onPaid?.(res.amountPaidCents ?? amountPaidCents + amountCents);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to record deposit");
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[22rem] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <div
            className="relative overflow-hidden rounded-[28px] ring-1 ring-white/60"
            style={{
              background: "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
              boxShadow:
                "0 30px 80px -20px rgba(40, 32, 24, 0.35), 0 8px 24px -8px rgba(40, 32, 24, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(40rem 22rem at 50% -20%, rgba(237, 230, 248, 0.7) 0%, transparent 60%)",
              }}
            />

            <div className="relative px-7 pt-7 pb-6">
              <DialogPrimitive.Title className="sr-only">
                Pay deposit
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Record a deposit payment for this booking. Submitting confirms
                the booking.
              </DialogPrimitive.Description>

              {/* Hero — deposit amount */}
              <div className="flex flex-col items-center text-center">
                <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
                  Pay deposit
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className="font-[family-name:var(--font-raleway)] font-[100] leading-none tracking-[-0.04em] text-[#1a1614] tabular-nums"
                    style={{ fontSize: "clamp(2.75rem, 12vw, 3.75rem)" }}
                  >
                    {amountCents > 0 ? fmtEGP(amountCents) : "—"}
                  </span>
                  <span className="pb-1 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400] text-[#8a8480]">
                    EGP
                  </span>
                </div>
                {total > 0 && (
                  <div className="mt-2 font-[family-name:var(--font-roboto-mono)] text-[0.7rem] tracking-[0.04em] text-[#8a8480]">
                    {fmtEGP(remainingAfter)}
                    <span className="ml-1 text-[#b0a89f]">EGP remaining after</span>
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="mt-7 space-y-1.5">
                <label className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.18em] uppercase font-[600] text-[#8a8480]">
                  Amount (EGP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                  }}
                  placeholder="0"
                  autoFocus
                  className="w-full rounded-xl border border-[#ece8e3] bg-white/70 px-3.5 py-2.5 text-[1rem] text-[#1a1614] font-[family-name:var(--font-roboto)] focus:outline-none focus:border-[#1a1614] transition-colors"
                />
              </div>

              {/* Method selector */}
              <div className="mt-4 space-y-1.5">
                <label className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.18em] uppercase font-[600] text-[#8a8480]">
                  Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {METHODS.map((m) => {
                    const active = method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        className={`rounded-xl border py-2 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] transition-all ${
                          active
                            ? "border-[#1a1614] bg-[#1a1614] text-white"
                            : "border-[#ece8e3] bg-white/60 text-[#5b5650] hover:border-[#d6d0c8]"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference */}
              <div className="mt-4 space-y-1.5">
                <label className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.18em] uppercase font-[600] text-[#8a8480]">
                  Reference <span className="text-[#b0a89f]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. transfer ref, note"
                  className="w-full rounded-xl border border-[#ece8e3] bg-white/70 px-3.5 py-2.5 text-[0.92rem] text-[#1a1614] font-[family-name:var(--font-roboto)] focus:outline-none focus:border-[#1a1614] transition-colors"
                />
              </div>

              {/* Buttons */}
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
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="h-11 rounded-full bg-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(26,22,20,0.45)] transition-all duration-150 hover:bg-[#2a2522] active:scale-[0.985] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving…" : "Confirm & pay"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
