"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

import { updateBookingParty } from "@/lib/actions/booking.actions";
import { computeBookingTotalCents } from "@/lib/pricing";

type Props = {
  bookingId: string;
  adults: number;
  kids: number;
  service: string;
  dateIso: string;
};

function PartyDisplay({ adults, kids }: { adults: number; kids: number }) {
  const totalPeople = adults + kids;
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-raleway)] text-[3.5rem] font-[100] leading-none tracking-[-0.03em] text-[#1a1614]">
          {totalPeople}
        </span>
        <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#8a8480]">
          {totalPeople === 1 ? "person" : "people"}
        </span>
      </div>
      <div className="mt-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#5b5650] font-[400]">
        {adults} {adults === 1 ? "adult" : "adults"}
        {kids > 0 && (
          <>
            <span className="mx-1.5 text-[#d6d0c8]">·</span>
            {kids} {kids === 1 ? "kid" : "kids"}
          </>
        )}
      </div>
    </>
  );
}

function StepperButton({
  ariaLabel,
  onClick,
  disabled,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur-sm border border-[#ece8e3] text-[#1a1614] shadow-[0_1px_2px_rgba(40,32,24,0.04)] transition-all duration-150 ease-out hover:bg-white hover:border-[#d6d0c8] active:scale-[0.92] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:border-[#ece8e3]"
    >
      {children}
    </button>
  );
}

function StepperRow({
  label,
  value,
  min,
  onChange,
  isLast,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        isLast ? "" : "border-b border-[#ece8e3]/70"
      }`}
    >
      <div>
        <div className="font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] text-[#1a1614]">
          {label}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StepperButton
          ariaLabel={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
        </StepperButton>
        <span className="w-6 text-center font-[family-name:var(--font-roboto-mono)] tabular-nums text-[1.05rem] text-[#1a1614]">
          {value}
        </span>
        <StepperButton
          ariaLabel={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        </StepperButton>
      </div>
    </div>
  );
}

export default function PartyEditDialog({
  bookingId,
  adults,
  kids,
  service,
  dateIso,
}: Props) {
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

  const onSave = async () => {
    if (adultsValue < 1) {
      toast.error("Adults must be at least 1");
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
      toast.error(res.message ?? "Failed to update party");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Edit party"
          className="block w-full text-left rounded-lg -m-2 p-2 transition-colors hover:bg-[#f3efe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d0c8]"
        >
          <PartyDisplay adults={adults} kids={kids} />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[22rem] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
        >
          {/* Apple-sheet surface */}
          <div
            className="relative overflow-hidden rounded-[28px] ring-1 ring-white/60"
            style={{
              background:
                "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
              boxShadow:
                "0 30px 80px -20px rgba(40, 32, 24, 0.35), 0 8px 24px -8px rgba(40, 32, 24, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            }}
          >
            {/* warm vibrancy wash */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(40rem 22rem at 50% -20%, rgba(255, 244, 224, 0.7) 0%, transparent 60%)",
              }}
            />

            <div className="relative px-7 pt-7 pb-6">
              <DialogPrimitive.Title className="sr-only">Edit party</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Adjust the number of adults and kids on this booking.
              </DialogPrimitive.Description>

              {/* Hero — total people */}
              <div className="flex flex-col items-center text-center">
                <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
                  Party
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className="font-[family-name:var(--font-raleway)] font-[100] leading-none tracking-[-0.04em] text-[#1a1614] tabular-nums transition-all duration-200"
                    style={{ fontSize: "clamp(4rem, 16vw, 5.5rem)" }}
                  >
                    {totalPeople}
                  </span>
                  <span className="pb-1 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400] text-[#8a8480]">
                    {totalPeople === 1 ? "person" : "people"}
                  </span>
                </div>
                {previewCents !== null && (
                  <div className="mt-2 font-[family-name:var(--font-roboto-mono)] text-[0.7rem] tracking-[0.04em] text-[#8a8480]">
                    {new Intl.NumberFormat("en-EG").format(Math.round(previewCents / 100))}
                    <span className="ml-1 text-[#b0a89f]">EGP total</span>
                  </div>
                )}
              </div>

              {/* Stepper card */}
              <div className="mt-7 rounded-2xl bg-white/55 backdrop-blur-sm ring-1 ring-[#ece8e3] overflow-hidden">
                <StepperRow
                  label="Adults"
                  value={adultsValue}
                  min={1}
                  onChange={setAdultsValue}
                />
                <StepperRow
                  label="Kids"
                  value={kidsValue}
                  min={0}
                  onChange={setKidsValue}
                  isLast
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
                  onClick={onSave}
                  disabled={isSubmitting}
                  className="h-11 rounded-full bg-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(26,22,20,0.45)] transition-all duration-150 hover:bg-[#2a2522] active:scale-[0.985] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
