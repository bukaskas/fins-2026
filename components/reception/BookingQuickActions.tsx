"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookingStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateBookingStatus } from "@/lib/actions/booking.actions";

type ActionSpec = {
  label: string;
  status: BookingStatus;
  variant?: "default" | "outline" | "destructive";
  confirm?: string;
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
  const [confirming, setConfirming] = useState<ActionSpec | null>(null);

  const run = (status: BookingStatus, label: string) => {
    setBusy(status);
    startTransition(async () => {
      try {
        const res = await updateBookingStatus(bookingId, status);
        if (res.success) {
          toast.success(`${label} completed`);
          if ("warning" in res && res.warning) {
            toast.warning(String(res.warning));
          }
          setConfirming(null);
          router.refresh();
        } else {
          toast.error(("message" in res && res.message) || "Action failed.");
        }
      } catch {
        toast.error("The action could not be completed. Check your connection and retry.");
      } finally {
        setBusy(null);
      }
    });
  };

  if (confirming) {
    return (
      <div
        className="flex w-full flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 sm:w-auto"
        role="alert"
      >
        <p className="max-w-64 text-sm font-medium text-red-900">
          {confirming.confirm}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setConfirming(null)}
            className="h-10 sm:h-9"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(confirming.status, confirming.label)}
            className="h-10 sm:h-9"
          >
            {busy === confirming.status && <Loader2 className="animate-spin" />}
            Confirm decline
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
      {actions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.variant ?? "outline"}
          disabled={isPending}
          onClick={() =>
            a.confirm ? setConfirming(a) : run(a.status, a.label)
          }
          className="h-10 px-3 text-sm sm:h-9 sm:text-xs"
        >
          {busy === a.status && <Loader2 className="animate-spin" />}
          {a.label}
        </Button>
      ))}
    </div>
  );
}
