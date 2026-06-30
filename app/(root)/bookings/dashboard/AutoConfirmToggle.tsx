"use client";

import * as React from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { setAutoConfirmBookings } from "@/lib/actions/settings.actions";

/**
 * Dashboard toggle controlling how brand-new customers' bookings start out:
 * - ON  → new bookings go straight to WAITING_PAYMENT on submit.
 * - OFF → new bookings start as PENDING (availability review).
 * Existing customers always go to WAITING_PAYMENT regardless of this setting.
 */
export default function AutoConfirmToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  const handleChange = (next: boolean) => {
    const prev = enabled;
    setEnabled(next); // optimistic
    startTransition(async () => {
      const res = await setAutoConfirmBookings(next);
      if (res.success) {
        toast.success(
          next
            ? "Auto-confirm on — new bookings go straight to payment"
            : "Auto-confirm off — new bookings start as pending",
        );
      } else {
        setEnabled(prev); // revert
        toast.error(res.message ?? "Couldn't update the setting");
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 border border-[#ece8e3] bg-white px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.18em] uppercase font-[700] text-[#1a1614]">
            Auto-confirm new bookings
          </p>
          <span
            className="inline-flex items-center font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.12em] uppercase font-[700] px-2 py-0.5"
            style={{
              background: enabled ? "#E2F0E6" : "#F2F1EE",
              color: enabled ? "#1F5B36" : "#615C55",
            }}
          >
            {enabled ? "On" : "Off"}
          </span>
        </div>
        <p className="mt-1.5 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#8a8480] leading-[1.5]">
          {enabled
            ? "New bookings are set to “Waiting payment” right after submit."
            : "New bookings start as “Pending” for review. Existing customers always go to payment."}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label="Auto-confirm new bookings"
      />
    </div>
  );
}
