"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { setAutoConfirmBookings } from "@/lib/actions/settings.actions";

/**
 * Controls how brand-new customers' bookings start out:
 * - ON  → straight to WAITING_PAYMENT on submit (24h payment clock starts).
 * - OFF → PENDING, so staff review availability first.
 * Existing customers always go to WAITING_PAYMENT regardless of this setting.
 * Every change goes through a confirm step because it affects every future
 * booking, not the one in front of you.
 */
export default function SkipReviewSetting({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = React.useState(initial);
  const [requested, setRequested] = React.useState<boolean | null>(null);
  const [pending, startTransition] = React.useTransition();

  const confirm = () => {
    if (requested === null) return;
    const next = requested;
    startTransition(async () => {
      const res = await setAutoConfirmBookings(next);
      if (res.success) {
        setEnabled(next);
        setRequested(null);
        toast.success(
          next
            ? "Review skipped — new customers now go straight to payment"
            : "Review on — new customers' bookings now start as Pending",
        );
      } else {
        toast.error(res.message ?? "Couldn't update the setting");
      }
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 border border-paper-line bg-white px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="skip-review-label"
              className="font-[family-name:var(--font-raleway)] text-[1rem] font-[700] text-ink"
            >
              Skip review for new customers
            </h2>
            <span
              className={`inline-flex items-center font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.1em] uppercase font-[700] px-2 py-0.5 ${
                enabled
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-paper-line text-ink-muted"
              }`}
            >
              {enabled ? "On" : "Off"}
            </span>
          </div>
          <p className="mt-1.5 max-w-[60ch] font-[family-name:var(--font-raleway)] text-[0.875rem] font-[400] text-ink-muted leading-[1.5]">
            {enabled
              ? "New customers' bookings go straight to “Waiting payment” and their 24-hour payment clock starts as soon as they book. Nobody checks availability first."
              : "New customers' bookings start as “Pending” until someone on staff reviews them."}{" "}
            Existing customers always go straight to payment.
          </p>
        </div>
        <div className="flex min-h-11 shrink-0 items-center">
          <Switch
            checked={enabled}
            onCheckedChange={(next) => setRequested(next)}
            disabled={pending}
            aria-labelledby="skip-review-label"
          />
        </div>
      </div>

      <Dialog
        open={requested !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setRequested(null);
        }}
      >
        <DialogContent className="font-[family-name:var(--font-raleway)]">
          <DialogHeader>
            <DialogTitle>
              {requested
                ? "Skip review for new customers?"
                : "Review new customers' bookings first?"}
            </DialogTitle>
            <DialogDescription className="text-[0.875rem] leading-[1.5] text-ink-muted">
              {requested
                ? "From now on, every new customer's booking goes straight to “Waiting payment”. The 24-hour payment clock starts the moment they book, and bookings left unpaid are cancelled automatically. Nobody checks availability first."
                : "From now on, every new customer's booking starts as “Pending” and waits for staff to review it before payment is requested. Existing customers still go straight to payment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => setRequested(null)}
            >
              Keep it {enabled ? "on" : "off"}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={confirm}>
              {pending
                ? "Saving…"
                : requested
                  ? "Skip review"
                  : "Turn review on"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
