"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentMethod } from "@prisma/client";
import { updatePayment } from "@/lib/actions/payment.actions";

type PaymentRow = {
  id: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
  receivedAt: string;
  user: { id: string; name: string | null; email: string };
};

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.VISA,
  PaymentMethod.TRANSFER,
  PaymentMethod.EURO,
  PaymentMethod.USD,
  PaymentMethod.DISCOUNT,
];

export default function EditPaymentForm({ payment }: { payment: PaymentRow }) {
  const router = useRouter();
  const [submitting, startSubmit] = useTransition();
  const [amount, setAmount] = useState((payment.amountCents / 100).toFixed(2));
  const [receivedAt, setReceivedAt] = useState(toLocalDateTimeInput(payment.receivedAt));
  const [method, setMethod] = useState<PaymentMethod>(payment.method);
  const [reference, setReference] = useState(payment.reference ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = Number(amount.replace(",", "."));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }
    const amountCents = Math.round(amountNum * 100);

    const date = new Date(receivedAt);
    if (Number.isNaN(date.getTime())) {
      toast.error("Invalid date.");
      return;
    }

    startSubmit(async () => {
      const result = await updatePayment(payment.id, {
        receivedAt: date,
        amountCents,
        method,
        reference: reference.trim() || null,
      });
      if (result.success) {
        toast.success("Payment updated.");
        router.push("/accounting/payments");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update payment.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Payment</h1>
        <Link
          href="/accounting/payments"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to payments
        </Link>
      </div>

      <div className="mb-4 rounded-md border bg-muted/30 p-3 text-sm">
        <div className="font-medium">{payment.user.name || "Unnamed guest"}</div>
        <div className="text-xs text-muted-foreground">{payment.user.email}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Amount (EGP)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date received</label>
          <input
            type="datetime-local"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            disabled={submitting}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            disabled={submitting}
            className="w-full rounded border px-3 py-2"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={submitting}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Changing the amount rebuilds payment allocations across the guest&apos;s open orders (FIFO) and recomputes order statuses.
        </p>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/accounting/payments"
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/85 transition-colors disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
