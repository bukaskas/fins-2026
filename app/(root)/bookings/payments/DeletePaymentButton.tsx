"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteDepositPayment } from "@/lib/actions/booking.actions";

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
    const result = await deleteDepositPayment(paymentId);
    setDeleting(false);
    if (result.success) {
      toast.success("Payment deleted");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Delete payment"
      className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.16em] uppercase font-[700] text-[#b0a89f] hover:text-[#b3261e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {deleting ? "…" : "Delete"}
    </button>
  );
}
