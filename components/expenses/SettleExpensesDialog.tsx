"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentMethod } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { settlePayeeExpenses } from "@/lib/actions/expense.actions";
import { formatEGP } from "@/lib/commission";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

const METHODS: PaymentMethod[] = ["CASH", "TRANSFER", "CARD", "DISCOUNT"];

type Props = {
  payeeId: string;
  payeeName: string;
  pendingCount: number;
  pendingCents: number;
};

export function SettleExpensesButton({
  payeeId,
  payeeName,
  pendingCount,
  pendingCents,
}: Props) {
  const [open, setOpen] = useState(false);
  const disabled = pendingCount === 0;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        style={{
          fontFamily: apple,
          fontSize: "14px",
          fontWeight: 500,
          color: "#ffffff",
          background: "#0071e3",
          border: "none",
          padding: "8px 18px",
          borderRadius: "980px",
          cursor: disabled ? "not-allowed" : "pointer",
          letterSpacing: "-0.01em",
          opacity: disabled ? 0.4 : 1,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "#0077ed";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#0071e3";
        }}
      >
        Settle as paid
      </button>
      <SettleDialogInner
        open={open}
        onOpenChange={setOpen}
        payeeId={payeeId}
        payeeName={payeeName}
        pendingCount={pendingCount}
        pendingCents={pendingCents}
      />
    </>
  );
}

function SettleDialogInner({
  open,
  onOpenChange,
  payeeId,
  payeeName,
  pendingCount,
  pendingCents,
}: Props & { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [receivedAt, setReceivedAt] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (pendingCount === 0) return;
    setSaving(true);
    const res = await settlePayeeExpenses({
      payeeId,
      method,
      reference: reference || null,
      receivedAt: new Date(`${receivedAt}T12:00:00`),
    });
    setSaving(false);
    if (res.success) {
      toast.success(
        `Settled ${res.count} expense${res.count === 1 ? "" : "s"} · ${formatEGP(
          res.totalCents
        )}`
      );
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to settle expenses");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 overflow-hidden sm:max-w-[440px]"
        style={{
          fontFamily: apple,
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: "0.5px solid #d2d2d7" }}
        >
          <p
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "#1d1d1f",
              letterSpacing: "-0.022em",
            }}
          >
            Settle Expenses
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#6e6e73",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Record a payout to <strong>{payeeName}</strong>. One payment will be
            created and every pending expense for this payee will be marked paid
            against it.
          </p>
        </div>

        <div
          className="px-6 py-5"
          style={{ borderBottom: "0.5px solid #d2d2d7" }}
        >
          <div className="flex items-baseline justify-between">
            <span style={{ fontSize: "13px", color: "#6e6e73" }}>
              {pendingCount} pending expense{pendingCount === 1 ? "" : "s"}
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#1d1d1f",
                letterSpacing: "-0.022em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatEGP(pendingCents)}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Labelled label="Method">
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                disabled={saving}
                style={{
                  fontFamily: apple,
                  width: "100%",
                  appearance: "none",
                  background: "#f5f5f7",
                  color: "#1d1d1f",
                  fontSize: "14px",
                  padding: "10px 36px 10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="#6e6e73"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Labelled>

          <Labelled label="Date">
            <input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              disabled={saving}
              style={{
                fontFamily: apple,
                width: "100%",
                background: "#f5f5f7",
                color: "#1d1d1f",
                fontSize: "14px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                outline: "none",
              }}
            />
          </Labelled>

          <Labelled
            label={
              <>
                Reference{" "}
                <span
                  style={{
                    textTransform: "none",
                    letterSpacing: 0,
                    fontWeight: 400,
                    color: "#aeaeb2",
                  }}
                >
                  (optional)
                </span>
              </>
            }
          >
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={saving}
              placeholder="e.g. May payout, transfer #1234"
              style={{
                fontFamily: apple,
                width: "100%",
                background: "#f5f5f7",
                color: "#1d1d1f",
                fontSize: "14px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                outline: "none",
              }}
            />
          </Labelled>
        </div>

        <div
          className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: "0.5px solid #d2d2d7" }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#0071e3",
              background: "transparent",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              opacity: saving ? 0.4 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || pendingCount === 0}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              background: "#0071e3",
              border: "none",
              padding: "7px 18px",
              borderRadius: "8px",
              cursor: saving || pendingCount === 0 ? "not-allowed" : "pointer",
              opacity: saving || pendingCount === 0 ? 0.4 : 1,
            }}
          >
            {saving ? "Settling…" : `Settle ${formatEGP(pendingCents)}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Labelled({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#6e6e73",
          display: "block",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
