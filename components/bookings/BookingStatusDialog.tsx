"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { BookingStatus } from "@prisma/client";

import { updateBookingStatus } from "@/lib/actions/booking.actions";
import {
  CONFIRMATION_STATUSES,
  FOCUS_RING,
  MUTED,
  STATUS_BORDER,
  STATUS_CONSEQUENCE,
  STATUS_GROUPS,
  STATUS_LABEL,
  STATUS_TEXT,
} from "@/lib/bookings/status";

/**
 * Shared staff status picker. Consequential transitions never happen from a
 * menu click: staff see the consequence and confirm before the server action.
 */
export default function BookingStatusDialog({
  bookingId,
  status,
  trigger,
  onChanged,
}: {
  bookingId: string;
  status: BookingStatus;
  trigger: React.ReactNode;
  onChanged?: (status: BookingStatus) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BookingStatus>(status);
  const [confirming, setConfirming] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected(status);
      setConfirming(false);
    }
  }, [open, status]);

  const dirty = selected !== status;
  const needsConfirm = CONFIRMATION_STATUSES.includes(selected);
  const consequence = STATUS_CONSEQUENCE[selected];

  const save = async () => {
    if (!dirty || isSubmitting) return;
    if (needsConfirm && !confirming) {
      setConfirming(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateBookingStatus(bookingId, selected);
      if (!result.success) {
        toast.error(result.message || "Could not update the status. Try again.");
        return;
      }

      onChanged?.(selected);
      toast.success(`Status set to ${STATUS_LABEL[selected]}`);
      if ("warning" in result && result.warning) {
        toast.warning(String(result.warning));
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Check the connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) setOpen(nextOpen);
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Change status, currently ${STATUS_LABEL[status]}`}
          className={`inline-flex min-h-11 items-center rounded-full transition-opacity hover:opacity-80 ${FOCUS_RING}`}
        >
          {trigger}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1a1614]/35 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#ece8e3] bg-white shadow-[0_24px_60px_-24px_rgba(26,22,20,0.45)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
          <div className="shrink-0 border-b border-[#ece8e3] px-5 py-4">
            <DialogPrimitive.Title className="font-[family-name:var(--font-raleway)] text-base font-[600] text-[#1a1614]">
              Booking status
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className="mt-1 font-[family-name:var(--font-raleway)] text-[0.8rem]"
              style={{ color: MUTED }}
            >
              Select a state. Timers, promises, and closures require confirmation.
            </DialogPrimitive.Description>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {STATUS_GROUPS.map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <div
                  className="mb-2 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.14em]"
                  style={{ color: MUTED }}
                >
                  {group.label}
                </div>
                <div role="radiogroup" aria-label={group.label} className="space-y-1.5">
                  {group.statuses.map((candidate) => {
                    const active = selected === candidate;
                    return (
                      <button
                        key={candidate}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelected(candidate);
                          setConfirming(false);
                        }}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors disabled:opacity-50 ${FOCUS_RING} ${
                          active
                            ? "border-[#1a1614] bg-[#faf9f7]"
                            : "border-[#ece8e3] hover:border-[#d6d0c8]"
                        }`}
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: STATUS_BORDER[candidate] }}
                        />
                        <span
                          className="flex-1 font-[family-name:var(--font-raleway)] text-[0.88rem] font-[500]"
                          style={{ color: active ? STATUS_TEXT[candidate] : "#1a1614" }}
                        >
                          {STATUS_LABEL[candidate]}
                        </span>
                        {active && (
                          <Check className="size-4 shrink-0 text-[#1a1614]" strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-[#ece8e3] px-5 py-4">
            {dirty && consequence && (
              <p
                className={`mb-3 flex gap-2 font-[family-name:var(--font-raleway)] text-[0.8rem] leading-snug ${
                  needsConfirm ? "text-[#b91c1c]" : ""
                }`}
                style={needsConfirm ? undefined : { color: MUTED }}
              >
                {needsConfirm && (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                )}
                <span>{consequence}</span>
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.14em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-50 ${FOCUS_RING}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || isSubmitting}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.14em] text-white transition-colors disabled:opacity-40 ${FOCUS_RING} ${
                  confirming
                    ? "bg-[#b91c1c] hover:bg-[#a01818]"
                    : "bg-[#1a1614] hover:bg-[#2a2522]"
                }`}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                )}
                {confirming ? `Confirm ${STATUS_LABEL[selected]}` : "Save status"}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
