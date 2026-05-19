"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentMethod } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { settleInstructorCommissions } from "@/lib/actions/commission.actions";
import { formatEGP } from "@/lib/commission";

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  from: Date;
  to: Date;
  pendingCount: number;
  pendingCents: number;
  periodLabel: string;
};

const METHODS: PaymentMethod[] = ["CASH", "TRANSFER", "CARD", "DISCOUNT"];

export function SettleCommissionsDialog({
  open,
  onOpenChange,
  instructorId,
  from,
  to,
  pendingCount,
  pendingCents,
  periodLabel,
}: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [receivedAt, setReceivedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (pendingCount === 0) return;
    setSaving(true);
    const res = await settleInstructorCommissions({
      instructorId,
      from,
      to,
      method,
      reference: reference || null,
      receivedAt: new Date(`${receivedAt}T12:00:00`),
    });
    setSaving(false);
    if (res.success) {
      toast.success(`Settled ${res.count} commission${res.count === 1 ? "" : "s"} · ${formatEGP(res.totalCents)}`);
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to settle commissions");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 overflow-hidden sm:max-w-[420px]"
        style={{
          fontFamily: apple,
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)",
        }}
      >
        {/* Title bar */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: "0.5px solid #d2d2d7" }}>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.022em" }}>
            Settle Commissions
          </p>
          <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "4px", lineHeight: 1.4 }}>
            Record a payout for {periodLabel}. A single payment will be created and every pending commission in this period will be marked paid against it.
          </p>
        </div>

        {/* Summary */}
        <div className="px-6 py-5" style={{ borderBottom: "0.5px solid #d2d2d7" }}>
          <div className="flex items-baseline justify-between">
            <span style={{ fontSize: "13px", color: "#6e6e73" }}>
              {pendingCount} pending commission{pendingCount === 1 ? "" : "s"}
            </span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.022em" }}>
              {formatEGP(pendingCents)}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Method */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73", display: "block", marginBottom: "8px" }}>
              Method
            </label>
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
                width="10" height="6" viewBox="0 0 10 6" fill="none"
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <path d="M1 1L5 5L9 1" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73", display: "block", marginBottom: "8px" }}>
              Date
            </label>
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
          </div>

          {/* Reference */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73", display: "block", marginBottom: "8px" }}>
              Reference <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "#aeaeb2" }}>(optional)</span>
            </label>
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
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: "0.5px solid #d2d2d7" }}
        >
          <button
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>
          <button
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving && pendingCount > 0) e.currentTarget.style.background = "#0077ed"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0071e3"; }}
          >
            {saving ? "Settling…" : `Settle ${formatEGP(pendingCents)}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
