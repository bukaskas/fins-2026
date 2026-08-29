"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { Check, Copy, ExternalLink, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  checkBookingPaymentStatus,
  createBookingPaymentLink,
  deleteDepositPayment,
} from "@/lib/actions/booking.actions";
import PayDepositDialog from "@/components/bookings/PayDepositDialog";
import { FOCUS_RING, MUTED } from "@/lib/bookings/status";
import { WAITING_PAYMENT_WINDOW_MS } from "@/lib/constants";
import PaymentCountdown from "../PaymentCountdown";

/**
 * Money on one booking: what is owed, how long the hold has left, what has
 * actually been taken, and the link to chase.
 *
 * The ledger is the point. The booking page showed a 3px progress bar and no
 * record at all, so a mistyped deposit had no visible trace and no way back.
 */

const egp = new Intl.NumberFormat("en-EG");

function fmt(cents: number): string {
  return egp.format(Math.round(cents / 100));
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  VISA: "Visa",
  TRANSFER: "Transfer",
  DISCOUNT: "Discount",
  EURO: "Euro",
  USD: "USD",
};

type PaymentRow = {
  id: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
  createdAt: string;
};

export default function PaymentPanel({
  bookingId,
  bookingStatus,
  totalPriceCents,
  amountPaidCents,
  paymentLink,
  waitingPaymentAt,
  payments,
}: {
  bookingId: string;
  bookingStatus: BookingStatus;
  totalPriceCents: number | null;
  amountPaidCents: number;
  paymentLink: string | null;
  waitingPaymentAt: string | null;
  payments: PaymentRow[];
}) {
  const router = useRouter();
  const [creating, startCreate] = React.useTransition();
  const [checking, startCheck] = React.useTransition();
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const total = totalPriceCents ?? 0;
  const balance = Math.max(0, total - amountPaidCents);

  const deadline =
    bookingStatus === BookingStatus.WAITING_PAYMENT && waitingPaymentAt
      ? new Date(new Date(waitingPaymentAt).getTime() + WAITING_PAYMENT_WINDOW_MS).toISOString()
      : null;

  const generate = () => {
    startCreate(async () => {
      const res = await createBookingPaymentLink(bookingId);
      if (res.success) {
        toast.success("Payment link ready");
        router.refresh();
      } else {
        toast.error(res.message ?? "Could not create a payment link.");
      }
    });
  };

  const checkStatus = () => {
    startCheck(async () => {
      const res = await checkBookingPaymentStatus(bookingId);
      if (!res.success) {
        toast.error(res.message ?? "Could not check the payment status.");
        return;
      }
      if (res.confirmed) {
        toast.success("Payment confirmed — booking updated");
        router.refresh();
      } else {
        toast.info("Nothing has been paid yet.");
      }
    });
  };

  const copyLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success("Payment link copied");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      window.setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 4000);
      return;
    }
    setRemovingId(id);
    void (async () => {
      const res = await deleteDepositPayment(id);
      setRemovingId(null);
      setConfirmId(null);
      if (res.success) {
        toast.success("Payment removed");
        router.refresh();
      } else {
        toast.error(res.message ?? "Could not remove the payment.");
      }
    })();
  };

  return (
    <section
      aria-labelledby="payment-heading"
      className="mt-6 rounded-2xl border border-[#ece8e3] bg-white p-4 shadow-[0_1px_6px_rgba(26,22,20,0.08)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2
          id="payment-heading"
          className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.2em] sm:text-[0.62rem]"
          style={{ color: MUTED }}
        >
          Payment
        </h2>
        {total > 0 ? (
          <p
            className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
            style={{ color: MUTED }}
          >
            <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums text-[#1a1614]">
              {fmt(amountPaidCents)}
            </span>{" "}
            paid of{" "}
            <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums text-[#1a1614]">
              {fmt(total)}
            </span>{" "}
            EGP
          </p>
        ) : (
          <p
            className="font-[family-name:var(--font-raleway)] text-[0.82rem]"
            style={{ color: MUTED }}
          >
            Total price not set
          </p>
        )}
      </div>

      {deadline && (
        <div className="mt-3">
          <PaymentCountdown deadline={deadline} />
        </div>
      )}

      {/* ledger — what has actually been taken, and by what method */}
      <div className="mt-4">
        {payments.length === 0 ? (
          <p
            className="rounded-xl bg-[#faf9f7] px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.82rem]"
            style={{ color: MUTED }}
          >
            Nothing recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#ece8e3] rounded-xl bg-[#faf9f7] px-4">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="font-[family-name:var(--font-roboto-mono)] text-[0.95rem] tabular-nums text-[#1a1614]">
                    {fmt(p.amountCents)}
                    <span
                      className="ml-1 font-[family-name:var(--font-raleway)] text-[0.75rem]"
                      style={{ color: MUTED }}
                    >
                      EGP
                    </span>
                  </span>
                  <span
                    className="mt-0.5 block font-[family-name:var(--font-raleway)] text-[0.78rem]"
                    style={{ color: MUTED }}
                  >
                    {METHOD_LABEL[p.method] ?? p.method}
                    <span className="mx-1.5 text-[#d6d0c8]">·</span>
                    {new Date(p.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {p.reference && (
                      <>
                        <span className="mx-1.5 text-[#d6d0c8]">·</span>
                        {p.reference}
                      </>
                    )}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  disabled={removingId === p.id}
                  aria-label={`Remove the ${fmt(p.amountCents)} EGP payment`}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 transition-colors disabled:opacity-50 ${FOCUS_RING} ${
                    confirmId === p.id
                      ? "bg-[#FBE3E1] text-[#b91c1c]"
                      : "text-[#6b6460] hover:bg-[#f2f0ed] hover:text-[#b91c1c]"
                  }`}
                >
                  {removingId === p.id ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
                  )}
                  {confirmId === p.id && (
                    <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] uppercase tracking-[0.12em]">
                      Confirm
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <PayDepositDialog
          bookingId={bookingId}
          totalPriceCents={totalPriceCents}
          amountPaidCents={amountPaidCents}
          trigger={
            <button
              type="button"
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-[#1a1614] px-5 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2a2522] ${FOCUS_RING}`}
            >
              {balance > 0 ? `Record payment · ${fmt(balance)} due` : "Record payment"}
            </button>
          }
        />

        {paymentLink ? (
          <>
            <button
              type="button"
              onClick={copyLink}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] ${FOCUS_RING}`}
            >
              {copied ? (
                <Check className="size-4 text-[#15803d]" strokeWidth={2} aria-hidden="true" />
              ) : (
                <Copy className="size-4" strokeWidth={1.7} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] ${FOCUS_RING}`}
            >
              <ExternalLink className="size-4" strokeWidth={1.7} aria-hidden="true" />
              Open
            </a>
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-50 ${FOCUS_RING}`}
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" strokeWidth={1.7} aria-hidden="true" />
              )}
              Check
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={generate}
            disabled={creating}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-50 ${FOCUS_RING}`}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Link2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
            )}
            Create payment link
          </button>
        )}
      </div>
    </section>
  );
}
