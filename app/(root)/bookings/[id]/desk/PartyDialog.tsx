"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Minus, Pencil, Plus } from "lucide-react";

import { updateBookingParty } from "@/lib/actions/booking.actions";
import { computeBookingTotalCents } from "@/lib/pricing";
import { FOCUS_RING, MUTED } from "@/lib/bookings/status";

/**
 * Party editor. The live price preview is kept exactly as it was — running the
 * real `computeBookingTotalCents` before anything is written is what lets
 * reception answer "what if my sister comes too?" out loud, mid-conversation.
 *
 * Fixed here: 36px steppers → 44px, and the dialog now scrolls.
 */

const egp = new Intl.NumberFormat("en-EG");

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-[family-name:var(--font-raleway)] text-[0.88rem] text-[#1a1614]">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`inline-flex size-11 items-center justify-center rounded-full border border-[#ece8e3] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-35 ${FOCUS_RING}`}
        >
          <Minus className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="w-8 text-center font-[family-name:var(--font-roboto-mono)] text-[1.05rem] tabular-nums text-[#1a1614]"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          className={`inline-flex size-11 items-center justify-center rounded-full border border-[#ece8e3] text-[#3a3531] transition-colors hover:border-[#d6d0c8] ${FOCUS_RING}`}
        >
          <Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function PartyDialog({
  bookingId,
  adults,
  kids,
  service,
  dateIso,
}: {
  bookingId: string;
  adults: number;
  kids: number;
  service: string;
  dateIso: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [adultsValue, setAdultsValue] = React.useState(adults);
  const [kidsValue, setKidsValue] = React.useState(kids);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAdultsValue(adults);
      setKidsValue(kids);
    }
  }, [open, adults, kids]);

  const totalPeople = adultsValue + kidsValue;
  const previewCents = React.useMemo(
    () => computeBookingTotalCents(service, new Date(dateIso), adultsValue, kidsValue),
    [service, dateIso, adultsValue, kidsValue],
  );
  const dirty = adultsValue !== adults || kidsValue !== kids;

  const onSave = async () => {
    if (adultsValue < 1) {
      toast.error("A booking needs at least one adult.");
      return;
    }
    setIsSubmitting(true);
    const res = await updateBookingParty(bookingId, adultsValue, kidsValue);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Party updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Could not update the party.");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Edit party size"
          className={`group flex min-h-11 w-full items-baseline gap-2 rounded-xl text-left ${FOCUS_RING}`}
        >
          <span className="font-[family-name:var(--font-raleway)] text-[2rem] font-[500] leading-none tabular-nums text-[#1a1614]">
            {adults + kids}
          </span>
          <span
            className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
            style={{ color: MUTED }}
          >
            {adults + kids === 1 ? "person" : "people"}
          </span>
          <Pencil
            className="ml-auto size-3.5 self-center opacity-60 transition-opacity group-hover:opacity-100"
            strokeWidth={1.7}
            style={{ color: MUTED }}
            aria-hidden="true"
          />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-[22rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#ece8e3] bg-white shadow-[0_24px_60px_-24px_rgba(26,22,20,0.45)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
          <div className="shrink-0 border-b border-[#ece8e3] px-5 py-4">
            <DialogPrimitive.Title className="font-[family-name:var(--font-raleway)] text-[1rem] font-[600] text-[#1a1614]">
              Party
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className="mt-1 font-[family-name:var(--font-raleway)] text-[0.8rem]"
              style={{ color: MUTED }}
            >
              The price updates as you change the numbers. Nothing is saved until
              you tap Save.
            </DialogPrimitive.Description>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <Stepper label="Adults" value={adultsValue} min={1} onChange={setAdultsValue} />
            <Stepper label="Kids" value={kidsValue} min={0} onChange={setKidsValue} />

            <div className="rounded-xl bg-[#faf9f7] px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="font-[family-name:var(--font-raleway)] text-[0.8rem]"
                  style={{ color: MUTED }}
                >
                  {totalPeople} {totalPeople === 1 ? "person" : "people"}
                </span>
                {previewCents == null ? (
                  <span
                    className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
                    style={{ color: MUTED }}
                  >
                    No price for this service
                  </span>
                ) : (
                  <span className="font-[family-name:var(--font-roboto-mono)] text-[1.05rem] tabular-nums text-[#1a1614]">
                    {egp.format(Math.round(previewCents / 100))}
                    <span
                      className="ml-1 font-[family-name:var(--font-raleway)] text-[0.78rem]"
                      style={{ color: MUTED }}
                    >
                      EGP
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#ece8e3] px-5 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] ${FOCUS_RING}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!dirty || isSubmitting}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1a1614] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2a2522] disabled:opacity-40 ${FOCUS_RING}`}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                )}
                Save
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
