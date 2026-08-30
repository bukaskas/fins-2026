"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteDepositPayment } from "@/lib/actions/booking.actions";
import { FOCUS_RING } from "@/lib/bookings/status";

export function DeletePaymentButton({
  paymentId,
  guestName,
}: {
  paymentId: string;
  guestName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete this payment${guestName ? ` for ${guestName}` : ""}? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const result = await deleteDepositPayment(paymentId);
      if (result.success) {
        toast.success("Payment deleted");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Could not reach the server. The payment was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-busy={deleting}
      aria-label={`Delete payment${guestName ? ` for ${guestName}` : ""}`}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.1em] uppercase font-[700] text-[#b91c1c] transition-colors hover:bg-[#FBE3E1] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
    >
      <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
