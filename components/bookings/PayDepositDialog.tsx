"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";

import { payBookingDeposit } from "@/lib/actions/booking.actions";
import { FOCUS_RING, MUTED } from "@/lib/bookings/status";

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
  const balance = Math.max(0, total - amountPaidCents);
  const suggestedDeposit = Math.max(0, Math.round(total / 2) - amountPaidCents);

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const amountInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAmount(suggestedDeposit > 0 ? String(suggestedDeposit / 100) : "");
      setMethod(PaymentMethod.CASH);
      setReference("");
      setAmountError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const remainingAfter = Math.max(0, total - (amountPaidCents + amountCents));
  // A clamped "0 EGP remaining" used to make a mistyped 5000 look calm.
  const overpayCents =
    total > 0 ? Math.max(0, amountPaidCents + amountCents - total) : 0;
  const amountHelpId = `deposit-amount-help-${bookingId}`;
  const amountErrorId = `deposit-amount-error-${bookingId}`;
  const amountDescribedBy = [
    total > 0 ? amountHelpId : null,
    amountError ? amountErrorId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const onSubmit = async () => {
    if (isSubmitting) return;
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setAmountError("Enter an amount greater than 0 EGP.");
      amountInputRef.current?.focus();
      return;
    }
    setAmountError(null);
    setIsSubmitting(true);
    try {
      const res = await payBookingDeposit(bookingId, {
        amountCents,
        method,
        reference: reference.trim() || null,
      });
      if (res.success) {
        toast.success("Payment recorded — booking confirmed");
        setOpen(false);
        onPaid?.(res.amountPaidCents ?? amountPaidCents + amountCents);
        router.refresh();
      } else {
        toast.error(res.message ?? "Could not record the payment. Check the details and try again.");
      }
    } catch {
      toast.error("Could not reach the server. Your payment details are still here—try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) setOpen(nextOpen);
      }}
    >
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-busy={isSubmitting}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#ece8e3] bg-white shadow-[0_24px_60px_-24px_rgba(26,22,20,0.45)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit();
            }}
          >
            <header className="border-b border-[#ece8e3] px-5 py-4">
              <DialogPrimitive.Title className="font-[family-name:var(--font-raleway)] text-xl font-[600] tracking-[-0.01em] text-[#1a1614]">
                Record payment
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className="mt-1 font-[family-name:var(--font-raleway)] text-[0.82rem]"
                style={{ color: MUTED }}
              >
                {total > 0
                  ? `${fmtEGP(balance)} EGP due`
                  : "Add the amount and payment method."}
              </DialogPrimitive.Description>
            </header>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-1.5">
                <label
                  htmlFor={`deposit-amount-${bookingId}`}
                  className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.14em] uppercase font-[600] text-[#6b6460]"
                >
                  Amount (EGP)
                </label>
                <input
                  ref={amountInputRef}
                  id={`deposit-amount-${bookingId}`}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError(null);
                  }}
                  placeholder="0"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={amountError ? "true" : undefined}
                  aria-describedby={amountDescribedBy}
                  className={`w-full rounded-xl border border-[#ece8e3] bg-white/70 px-3.5 py-2.5 text-[1rem] text-[#1a1614] font-[family-name:var(--font-roboto)] transition-colors disabled:opacity-50 ${FOCUS_RING}`}
                />
                {total > 0 && (
                  <p
                    id={amountHelpId}
                    className="font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#6b6460]"
                  >
                    {fmtEGP(remainingAfter)} EGP remains after this payment.
                  </p>
                )}
                {amountError && (
                  <p
                    id={amountErrorId}
                    role="alert"
                    className="text-[0.78rem] font-[500] text-[#b91c1c]"
                  >
                    {amountError}
                  </p>
                )}
                {overpayCents > 0 && (
                  <p className="rounded-xl bg-[#FBE3E1] px-3 py-2 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[500] text-[#7E2A23]">
                    {fmtEGP(overpayCents)} EGP above the amount due. Check before saving.
                  </p>
                )}
              </div>

              <div>
                <fieldset disabled={isSubmitting}>
                  <legend className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.14em] uppercase font-[600] text-[#6b6460]">
                    Method
                  </legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {METHODS.map((m) => {
                      const active = method === m.value;
                      return (
                        <label key={m.value} className="cursor-pointer rounded-xl">
                          <input
                            type="radio"
                            name={`payment-method-${bookingId}`}
                            value={m.value}
                            checked={active}
                            onChange={() => setMethod(m.value)}
                            className="peer sr-only"
                          />
                          <span
                            className={`flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#1a1614] peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 ${
                              active
                                ? "border-[#1a1614] bg-[#1a1614] text-white"
                                : "border-[#ece8e3] bg-white/60 text-[#5b5650] hover:border-[#d6d0c8]"
                            }`}
                          >
                            {m.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`deposit-reference-${bookingId}`}
                  className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.14em] uppercase font-[600] text-[#6b6460]"
                >
                  Reference <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id={`deposit-reference-${bookingId}`}
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. transfer ref, note"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border border-[#ece8e3] bg-white/70 px-3.5 py-2.5 text-[1rem] text-[#1a1614] font-[family-name:var(--font-roboto)] transition-colors disabled:opacity-50 ${FOCUS_RING}`}
                />
              </div>
            </div>

            <footer className="border-t border-[#ece8e3] bg-[#faf9f7] px-5 py-4">
              <p className="mb-3 font-[family-name:var(--font-raleway)] text-[0.78rem] leading-snug text-[#6b6460]">
                Recording this payment confirms the booking.
              </p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className={`h-11 rounded-full bg-white/60 border border-[#ece8e3] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[600] text-[#5b5650] transition-colors duration-150 hover:bg-white hover:border-[#d6d0c8] disabled:opacity-40 ${FOCUS_RING}`}
                  >
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`h-11 rounded-full bg-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(26,22,20,0.45)] transition-colors duration-150 hover:bg-[#2a2522] disabled:opacity-50 ${FOCUS_RING}`}
                >
                  {isSubmitting ? "Saving…" : "Record & confirm"}
                </button>
              </div>
            </footer>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
