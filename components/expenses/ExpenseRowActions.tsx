"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExpenseStatus, ExpenseType } from "@prisma/client";
import { cancelExpense } from "@/lib/actions/expense.actions";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

type Props = {
  id: string;
  type: ExpenseType;
  status: ExpenseStatus;
};

export function ExpenseRowActions({ id, type, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const canCancel =
    status === ExpenseStatus.PENDING && type !== ExpenseType.INSTRUCTOR_COMMISSION;

  if (!canCancel) return null;

  async function handleCancel() {
    if (!confirm("Cancel this expense?")) return;
    setBusy(true);
    const res = await cancelExpense(id);
    setBusy(false);
    if (res.success) {
      toast.success("Expense canceled");
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to cancel expense");
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleCancel}
      style={{
        fontFamily: apple,
        fontSize: "13px",
        fontWeight: 500,
        color: busy ? "#aeaeb2" : "#d8313a",
        background: "transparent",
        border: "none",
        padding: "4px 10px",
        borderRadius: "8px",
        cursor: busy ? "not-allowed" : "pointer",
        letterSpacing: "-0.01em",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!busy) e.currentTarget.style.background = "rgba(216,49,58,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {busy ? "Canceling…" : "Cancel"}
    </button>
  );
}
