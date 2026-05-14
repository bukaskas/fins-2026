"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentMethod } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  listPayoutPaymentsForInstructor,
  markCommissionPaid,
} from "@/lib/actions/commission.actions";
import { formatEGP } from "@/lib/commission";

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type Payment = {
  id: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
  receivedAt: Date;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionId: string;
  instructorId: string;
};

export function MarkPaidDialog({ open, onOpenChange, commissionId, instructorId }: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const loading = open && payments === null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listPayoutPaymentsForInstructor(instructorId).then((rows) => {
      if (!cancelled) setPayments(rows as Payment[]);
    });
    return () => { cancelled = true; };
  }, [open, instructorId]);

  async function handleConfirm() {
    if (!paymentId) { toast.error("Select a payment"); return; }
    setSaving(true);
    const res = await markCommissionPaid(commissionId, paymentId);
    setSaving(false);
    if (res.success) {
      toast.success("Commission marked as paid");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to mark commission as paid");
    }
  }

  const hasPayments = (payments ?? []).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 overflow-hidden sm:max-w-[400px]"
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
            Mark as Paid
          </p>
          <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "4px", lineHeight: 1.4 }}>
            Link an existing payment recorded for this instructor. Create the payment via Accounting first if it's not listed.
          </p>
        </div>

        {/* Payment selector */}
        <div className="px-6 py-5">
          <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73", display: "block", marginBottom: "8px" }}>
            Payment
          </label>

          {loading ? (
            <div style={{ background: "#f5f5f7", borderRadius: "10px", padding: "10px 14px", color: "#aeaeb2", fontSize: "15px" }}>
              Loading payments…
            </div>
          ) : !hasPayments ? (
            <div style={{ background: "#f5f5f7", borderRadius: "10px", padding: "10px 14px", color: "#aeaeb2", fontSize: "14px" }}>
              No payments recorded for this instructor
            </div>
          ) : (
            <div className="relative">
              <select
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                disabled={loading || saving}
                style={{
                  fontFamily: apple,
                  width: "100%",
                  appearance: "none",
                  background: "#f5f5f7",
                  color: paymentId ? "#1d1d1f" : "#aeaeb2",
                  fontSize: "14px",
                  padding: "10px 36px 10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.35)"; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <option value="" disabled>Select a payment…</option>
                {(payments ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {format(new Date(p.receivedAt), "dd MMM yyyy")} · {p.method.toLowerCase()} · {formatEGP(p.amountCents)}
                    {p.reference ? ` · ${p.reference}` : ""}
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
          )}
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
            disabled={saving || !paymentId}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              background: "#0071e3",
              border: "none",
              padding: "7px 18px",
              borderRadius: "8px",
              cursor: saving || !paymentId ? "not-allowed" : "pointer",
              opacity: saving || !paymentId ? 0.4 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving && paymentId) e.currentTarget.style.background = "#0077ed"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0071e3"; }}
          >
            {saving ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
