"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { BookingStatus } from "@prisma/client";

import { updateBookingStatus } from "@/lib/actions/booking.actions";

type ToneStyle = { label: string; bg: string; ring: string; text: string; dot: string };

type Props = {
  bookingId: string;
  status: BookingStatus;
  tones: Record<BookingStatus, ToneStyle>;
};

const STATUS_ORDER: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
  BookingStatus.WAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.ARRIVED,
  BookingStatus.DECLINED,
  BookingStatus.NO_RESPONSE_EXPIRED,
  BookingStatus.CANCELED,
];

function StatusPill({ tone }: { tone: ToneStyle }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
      style={{ background: tone.bg, borderColor: tone.ring, color: tone.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone.dot, boxShadow: `0 0 0 3px ${tone.bg}, 0 0 0 4px ${tone.dot}30` }}
      />
      <span className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.2em] uppercase font-[700]">
        {tone.label}
      </span>
    </span>
  );
}

function StatusRow({
  tone,
  selected,
  onClick,
}: {
  tone: ToneStyle;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-150 ease-out ${
        selected
          ? "bg-white/85 ring-1 ring-[#ece8e3] shadow-[0_1px_3px_rgba(40,32,24,0.04)]"
          : "bg-transparent hover:bg-white/45"
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full transition-transform duration-150 group-hover:scale-110"
        style={{
          background: tone.dot,
          boxShadow: selected ? `0 0 0 3px ${tone.bg}, 0 0 0 4px ${tone.dot}25` : undefined,
        }}
      />
      <span
        className={`font-[family-name:var(--font-raleway)] text-[0.86rem] tracking-[0.01em] transition-colors duration-150 ${
          selected ? "text-[#1a1614] font-[600]" : "text-[#5b5650] font-[400] group-hover:text-[#1a1614]"
        }`}
      >
        {tone.label}
      </span>
      <span
        className={`ml-auto grid h-5 w-5 place-items-center rounded-full transition-all duration-150 ${
          selected
            ? "bg-[#1a1614] text-white scale-100 opacity-100"
            : "scale-75 opacity-0"
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    </button>
  );
}

export default function StatusEditDialog({ bookingId, status, tones }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BookingStatus>(status);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setSelected(status);
  }, [open, status]);

  const onSave = async () => {
    if (selected === status) {
      setOpen(false);
      return;
    }
    setIsSubmitting(true);
    const res = await updateBookingStatus(bookingId, selected);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Status updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update status");
    }
  };

  const currentTone = tones[status];
  const selectedTone = tones[selected];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Change status"
          className="rounded-full transition-transform duration-150 hover:-translate-y-px active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d0c8]"
        >
          <StatusPill tone={currentTone} />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[22rem] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
        >
          <div
            className="relative overflow-hidden rounded-[28px] ring-1 ring-white/60"
            style={{
              background:
                "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
              boxShadow:
                "0 30px 80px -20px rgba(40, 32, 24, 0.35), 0 8px 24px -8px rgba(40, 32, 24, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            }}
          >
            {/* warm vibrancy wash, tinted to the selected status */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-[background] duration-300"
              style={{
                background: `radial-gradient(40rem 22rem at 50% -20%, ${selectedTone.dot}20 0%, transparent 60%)`,
              }}
            />

            <div className="relative px-6 pt-7 pb-6">
              <DialogPrimitive.Title className="sr-only">Change status</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Select a new status for this booking.
              </DialogPrimitive.Description>

              {/* Header */}
              <div className="flex flex-col items-center text-center mb-5">
                <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
                  Status
                </span>
                <div className="mt-3">
                  <StatusPill tone={selectedTone} />
                </div>
              </div>

              {/* List */}
              <div className="space-y-0.5 rounded-2xl bg-white/35 backdrop-blur-sm ring-1 ring-[#ece8e3] p-1.5">
                {STATUS_ORDER.map((s) => (
                  <StatusRow
                    key={s}
                    tone={tones[s]}
                    selected={selected === s}
                    onClick={() => setSelected(s)}
                  />
                ))}
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
                  disabled={isSubmitting || selected === status}
                  className="h-11 rounded-full bg-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.08em] uppercase font-[700] text-white shadow-[0_4px_14px_-4px_rgba(26,22,20,0.45)] transition-all duration-150 hover:bg-[#2a2522] active:scale-[0.985] disabled:opacity-40 disabled:hover:bg-[#1a1614]"
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
