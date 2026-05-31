"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { BookingStatus } from "@prisma/client";

import { APP_NAME } from "@/lib/constants";
import { getBookingsByDate, sendBulkEmails } from "@/lib/actions/booking.actions";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: BookingStatus.PENDING, label: "Pending" },
  { value: BookingStatus.REQUEST_SENT, label: "Request sent" },
  { value: BookingStatus.UNDER_REVIEW, label: "Under review" },
  { value: BookingStatus.WAITING_PAYMENT, label: "Waiting payment" },
  { value: BookingStatus.CONFIRMED, label: "Confirmed" },
  { value: BookingStatus.ARRIVED, label: "Arrived" },
  { value: BookingStatus.DECLINED, label: "Declined" },
  { value: BookingStatus.NO_RESPONSE_EXPIRED, label: "No response" },
  { value: BookingStatus.CANCELED, label: "Canceled" },
];

type Props = {
  defaultDate: string;
};

export function BulkEmailForm({ defaultDate }: Props) {
  const [date, setDate] = React.useState(defaultDate);
  const [statuses, setStatuses] = React.useState<BookingStatus[]>([]);
  const [subject, setSubject] = React.useState(`Update from ${APP_NAME}`);
  const [message, setMessage] = React.useState("");

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [preview, setPreview] = React.useState<{
    matched: number;
    withEmail: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const toggleStatus = (s: BookingStatus) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  // Recipient preview: refresh whenever date or statuses change.
  React.useEffect(() => {
    if (!date || statuses.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      const res = await getBookingsByDate(date, statuses);
      if (cancelled) return;
      setPreviewLoading(false);
      if (!res.success || !res.data) {
        setPreview(null);
        return;
      }
      const matched = res.data.length;
      const withEmail = res.data.filter(
        (b) => !!b.email && b.email.trim().length > 0,
      ).length;
      setPreview({ matched, withEmail });
    })();
    return () => {
      cancelled = true;
    };
  }, [date, statuses]);

  const messageEmpty = message.trim().length === 0;
  const subjectEmpty = subject.trim().length === 0;
  const noStatus = statuses.length === 0;
  const canSend = !messageEmpty && !subjectEmpty && !noStatus && !!date;

  const onConfirm = async () => {
    setIsSubmitting(true);
    const res = await sendBulkEmails(date, statuses, subject, message);
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.message ?? "Failed to send emails");
      return;
    }

    const parts = [`Sent ${res.sent}`];
    if (res.skippedNoEmail) parts.push(`${res.skippedNoEmail} skipped (no email)`);
    if (res.failed) parts.push(`${res.failed} failed`);
    toast.success(parts.join(" · "));
    setOpen(false);
  };

  const previewCount = preview?.withEmail ?? 0;

  return (
    <div className="space-y-8">
      {/* Date */}
      <div>
        <label className="block font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.18em] uppercase font-[600] text-[#5b5650] mb-2">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full max-w-[16rem] rounded-xl border border-[#ece8e3] bg-white/70 backdrop-blur-sm px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.9rem] text-[#1a1614] outline-none transition-colors focus:border-[#b0a89f]"
        />
      </div>

      {/* Statuses */}
      <div>
        <label className="block font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.18em] uppercase font-[600] text-[#5b5650] mb-3">
          Booking statuses
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = statuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleStatus(opt.value)}
                aria-pressed={active}
                className={
                  "rounded-full border px-4 py-2 font-[family-name:var(--font-raleway)] text-[0.78rem] tracking-[0.04em] font-[600] transition-all duration-150 active:scale-[0.985] " +
                  (active
                    ? "border-[#1a1614] bg-[#1a1614] text-white"
                    : "border-[#d6d0c8] bg-white/60 text-[#5b5650] hover:border-[#8a8480] hover:text-[#1a1614]")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {noStatus && (
          <p className="mt-2 font-[family-name:var(--font-raleway)] text-[0.74rem] text-[#b0a89f]">
            Select at least one status.
          </p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.18em] uppercase font-[600] text-[#5b5650] mb-2">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-[#ece8e3] bg-white/70 backdrop-blur-sm px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.92rem] text-[#1a1614] outline-none transition-colors focus:border-[#b0a89f]"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.18em] uppercase font-[600] text-[#5b5650] mb-2">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          placeholder="Type your message to guests…"
          className="w-full rounded-xl border border-[#ece8e3] bg-white/70 backdrop-blur-sm px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.92rem] leading-[1.6] text-[#1a1614] outline-none transition-colors focus:border-[#b0a89f] resize-y"
        />
      </div>

      {/* Recipient preview + send */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ece8e3] pt-6">
        <p className="font-[family-name:var(--font-roboto-mono)] text-[0.78rem] text-[#5b5650]">
          {previewLoading
            ? "Counting recipients…"
            : preview
              ? `${preview.matched} match · ${preview.withEmail} with email`
              : "Pick a date and at least one status to preview recipients."}
        </p>

        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={!canSend || isSubmitting}
              className="inline-flex items-center gap-2 bg-[#1a1614] text-white text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 py-2.5 font-[family-name:var(--font-raleway)] transition-colors duration-200 hover:bg-[#2a2420] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1a1614]"
            >
              Send email
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
                    Send bulk email?
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-3 font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] text-[#5b5650] leading-[1.6]">
                    This emails{" "}
                    <span className="text-[#1a1614] font-[600]">{previewCount}</span>{" "}
                    {previewCount === 1 ? "guest" : "guests"} and cannot be undone.
                    Booking statuses are not changed. Guests with no email on file
                    are skipped.
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
                      {isSubmitting ? "Sending…" : "Send email"}
                    </button>
                  </div>
                </div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </div>
  );
}
