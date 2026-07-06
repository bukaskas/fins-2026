"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookingStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { updateBookingStatus } from "@/lib/actions/booking.actions";

type ActionSpec = {
  label: string;
  status: BookingStatus;
  variant?: "default" | "outline" | "destructive";
};

/**
 * Inline status buttons for reception queue rows. Each button moves the
 * booking to a target status via the existing updateBookingStatus action
 * (which also assigns the acting agent and runs confirm side effects).
 */
export function BookingQuickActions({
  bookingId,
  actions,
}: {
  bookingId: string;
  actions: ActionSpec[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<BookingStatus | null>(null);

  const run = (status: BookingStatus, label: string) => {
    setBusy(status);
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, status);
      setBusy(null);
      if (res.success) {
        toast.success(`${label} ✓`);
        if ("warning" in res && res.warning) toast.warning(String(res.warning));
        router.refresh();
      } else {
        toast.error(("message" in res && res.message) || "Action failed.");
      }
    });
  };

  return (
    <div className="flex gap-1.5">
      {actions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.variant ?? "outline"}
          disabled={isPending}
          onClick={() => run(a.status, a.label)}
          className="h-7 px-2.5 text-xs"
        >
          {busy === a.status ? "…" : a.label}
        </Button>
      ))}
    </div>
  );
}
