"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CommissionType } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateCommission } from "@/lib/actions/commission.actions";
import { COMMISSION_TYPE_LABELS, formatEGP } from "@/lib/commission";

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: {
    id: string;
    commissionType: CommissionType;
    overrideAmountCents: number | null;
    calculatedAmountCents: number;
  };
};

export function CommissionEditDialog({ open, onOpenChange, commission }: Props) {
  const router = useRouter();
  const [commissionType, setCommissionType] = useState<CommissionType>(commission.commissionType);
  const [overrideInput, setOverrideInput] = useState<string>(
    commission.overrideAmountCents != null
      ? String(Math.round(commission.overrideAmountCents / 100))
      : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const trimmed = overrideInput.trim();
    const overrideAmountCents =
      trimmed === "" ? null : Math.max(0, Math.round(Number(trimmed) * 100));

    const res = await updateCommission(commission.id, { commissionType, overrideAmountCents });
    setSaving(false);

    if (res.success) {
      toast.success("Commission updated");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update commission");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 overflow-hidden sm:max-w-[380px]"
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
            Edit Commission
          </p>
          <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "4px", lineHeight: 1.4 }}>
            Auto-calculated: <span style={{ color: "#1d1d1f", fontWeight: 500 }}>{formatEGP(commission.calculatedAmountCents)}</span>
            <br />Leave override blank to use this amount.
          </p>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73" }}>
              Commission Type
            </label>
            <div className="relative">
              <select
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                style={{
                  fontFamily: apple,
                  width: "100%",
                  appearance: "none",
                  background: "#f5f5f7",
                  color: "#1d1d1f",
                  fontSize: "15px",
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
                {(Object.keys(COMMISSION_TYPE_LABELS) as CommissionType[]).map((t) => (
                  <option key={t} value={t}>{COMMISSION_TYPE_LABELS[t]}</option>
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

          <div className="flex flex-col gap-2">
            <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6e6e73" }}>
              Override Amount <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(EGP)</span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              placeholder="Empty = use calculated"
              style={{
                fontFamily: apple,
                width: "100%",
                background: "#f5f5f7",
                color: "#1d1d1f",
                fontSize: "15px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                outline: "none",
                transition: "box-shadow 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.35)"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
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
            onClick={handleSave}
            disabled={saving}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              background: "#0071e3",
              border: "none",
              padding: "7px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#0077ed"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0071e3"; }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
