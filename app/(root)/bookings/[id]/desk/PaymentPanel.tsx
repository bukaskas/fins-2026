"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { Check, ChevronDown, Copy, ExternalLink, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
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
  paymentLinkExpiresAt,
  waitingPaymentAt,
  payments,
}: {
  bookingId: string;
  bookingStatus: BookingStatus;
  totalPriceCents: number | null;
  amountPaidCents: number;
  paymentLink: string | null;
  paymentLinkExpiresAt: string | null;
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

  // Whether the link has lapsed is a clock question, and the clock differs
  // between server and client — so it is answered after mount. Until then the
  // link reads as live, which matches what the server rendered.
  const [mountedAt, setMountedAt] = React.useState<number | null>(null);
  React.useEffect(() => setMountedAt(Date.now()), [paymentLinkExpiresAt]);
  const linkExpired =
    mountedAt !== null &&
    paymentLinkExpiresAt !== null &&
    new Date(paymentLinkExpiresAt).getTime() <= mountedAt;

  const deadline =
    bookingStatus === BookingStatus.WAITING_PAYMENT && waitingPaymentAt
      ? new Date(new Date(waitingPaymentAt).getTime() + WAITING_PAYMENT_WINDOW_MS).toISOString()
      : null;

  const generate = () => {
    startCreate(async () => {
      try {
        const res = await createBookingPaymentLink(bookingId);
        if (res.success) {
          toast.success("Payment link ready");
          router.refresh();
        } else {
          toast.error(res.message ?? "Could not create a payment link.");
        }
      } catch {
        toast.error("Could not reach the payment service. Try creating the link again.");
      }
    });
  };

  const checkStatus = () => {
    startCheck(async () => {
      try {
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
      } catch {
        toast.error("Could not reach the payment service. Try checking again.");
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
      try {
        const res = await deleteDepositPayment(id);
        if (res.success) {
          toast.success("Payment removed");
          router.refresh();
        } else {
          toast.error(res.message ?? "Could not remove the payment.");
        }
      } catch {
        toast.error("Could not reach the server. The payment was not removed.");
      } finally {
        setRemovingId(null);
        setConfirmId(null);
      }
    })();
  };

  return (
    <section
      aria-labelledby="payment-heading"
      className="mt-6 rounded-2xl border border-[#ece8e3] bg-white p-4 shadow-[0_1px_6px_rgba(26,22,20,0.08)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2
          id="payment-heading"
          className="font-[family-name:var(--font-raleway)] text-lg font-[600] text-[#1a1614]"
        >
          Payment
        </h2>
        {total > 0 ? (
          <div className="text-right">
            <p className="font-[family-name:var(--font-roboto-mono)] text-base font-[600] tabular-nums text-[#1a1614]">
              {fmt(balance)} EGP due
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-raleway)] text-[0.78rem]" style={{ color: MUTED }}>
              {fmt(amountPaidCents)} of {fmt(total)} EGP paid
            </p>
          </div>
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
          <p className="border-y border-[#ece8e3] py-3 font-[family-name:var(--font-raleway)] text-[0.82rem]" style={{ color: MUTED }}>
            No payments yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#ece8e3] border-y border-[#ece8e3]">
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
                  aria-busy={removingId === p.id}
                  aria-label={
                    removingId === p.id
                      ? `Removing the ${fmt(p.amountCents)} EGP payment`
                      : confirmId === p.id
                        ? `Confirm removal of the ${fmt(p.amountCents)} EGP payment`
                        : `Remove the ${fmt(p.amountCents)} EGP payment`
                  }
                  className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 transition-colors disabled:opacity-50 ${FOCUS_RING} ${
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
                    <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.1em]">
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
              aria-label={`Record a payment${balance > 0 ? `, ${fmt(balance)} EGP due` : ""}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-[#1a1614] px-5 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2a2522] ${FOCUS_RING}`}
            >
              Record payment
            </button>
          }
        />

        {(!paymentLink || linkExpired) && (
          <button
            type="button"
            onClick={generate}
            disabled={creating}
            aria-busy={creating}
            aria-label={
              creating
                ? "Creating payment link"
                : linkExpired
                  ? "Replace the expired payment link"
                  : "Create payment link"
            }
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-50 ${FOCUS_RING}`}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Link2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
            )}
            {creating
              ? "Creating link…"
              : linkExpired
                ? "Replace expired link"
                : "Create payment link"}
          </button>
        )}
      </div>

      {paymentLink && (
        <details className="group mt-3 border-t border-[#ece8e3] pt-2">
          <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg font-[family-name:var(--font-raleway)] text-[0.82rem] font-[600] text-[#3a3531] ${FOCUS_RING}`}>
            <span>
              Online payment link
              {linkExpired && (
                <span className="ml-2 font-[400] text-[#b91c1c]">expired</span>
              )}
            </span>
            <ChevronDown
              className="size-4 text-[#6b6460] transition-transform group-open:rotate-180"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </summary>
          {linkExpired && (
            <p
              className="mt-2 font-[family-name:var(--font-raleway)] text-[0.78rem]"
              style={{ color: MUTED }}
            >
              This link has expired and will no longer take a payment. Replace it
              to send the guest a working one.
            </p>
          )}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy payment link"
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
              aria-label="Open payment link in a new tab"
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] ${FOCUS_RING}`}
            >
              <ExternalLink className="size-4" strokeWidth={1.7} aria-hidden="true" />
              Open payment link
            </a>
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              aria-busy={checking}
              aria-label={checking ? "Checking payment status" : "Check payment status"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ece8e3] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] uppercase tracking-[0.16em] text-[#3a3531] transition-colors hover:border-[#d6d0c8] disabled:opacity-50 ${FOCUS_RING}`}
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" strokeWidth={1.7} aria-hidden="true" />
              )}
              {checking ? "Checking…" : "Check payment status"}
            </button>
          </div>
        </details>
      )}
    </section>
  );
}
