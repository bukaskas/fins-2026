"use client";

import { useState } from "react";
import { CommissionStatus, CommissionType } from "@prisma/client";
import { CommissionStatusBadge } from "./CommissionStatusBadge";
import { CommissionEditDialog } from "./CommissionEditDialog";
import { MarkPaidDialog } from "./MarkPaidDialog";
import { COMMISSION_TYPE_LABELS, formatEGP } from "@/lib/commission";

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

export type CommissionCardData = {
  id: string;
  commissionType: CommissionType;
  durationMinutes: number;
  rateAtCreationCents: number;
  calculatedAmountCents: number;
  overrideAmountCents: number | null;
  finalAmountCents: number;
  status: CommissionStatus;
};

type Props = {
  commission: CommissionCardData | null;
  instructorId: string | null;
  reason?: "no-instructor" | "no-profile" | "no-qualifying-booking";
};

const REASON_TEXT: Record<NonNullable<Props["reason"]>, string> = {
  "no-instructor": "No instructor assigned to this session.",
  "no-profile": "Instructor has no commission rates configured.",
  "no-qualifying-booking": "Commission is created when a booking is confirmed or completed.",
};

export function CommissionCard({ commission, instructorId, reason }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);

  if (!commission) {
    return (
      <div
        style={{
          fontFamily: apple,
          background: "#f5f5f7",
          borderRadius: "12px",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d1d1f" }}>Commission</span>
          <span style={{ fontSize: "12px", color: "#aeaeb2" }}>Not tracked</span>
        </div>
        {reason && (
          <p style={{ marginTop: "6px", fontSize: "12px", color: "#6e6e73", lineHeight: 1.4 }}>
            {REASON_TEXT[reason]}
          </p>
        )}
      </div>
    );
  }

  const isPending = commission.status === CommissionStatus.PENDING;

  const h = Math.floor(commission.durationMinutes / 60);
  const m = commission.durationMinutes % 60;
  const durationDisplay = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;

  const rows: [string, string][] = [
    ["Type",           COMMISSION_TYPE_LABELS[commission.commissionType]],
    ["Duration",       durationDisplay],
    ["Rate snapshot",  `${formatEGP(commission.rateAtCreationCents)} / h`],
    ["Calculated",     formatEGP(commission.calculatedAmountCents)],
    ...(commission.overrideAmountCents != null
      ? [["Override", formatEGP(commission.overrideAmountCents)] as [string, string]]
      : []),
  ];

  return (
    <div
      style={{
        fontFamily: apple,
        background: "#f5f5f7",
        borderRadius: "12px",
        padding: "14px 16px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d1d1f" }}>Commission</span>
        <CommissionStatusBadge status={commission.status} />
      </div>

      {/* Data rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: "0.5px solid rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: "12px", color: "#6e6e73" }}>{label}</span>
            <span style={{ fontSize: "12px", color: "#1d1d1f" }}>{value}</span>
          </div>
        ))}

        {/* Final — emphasized */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "9px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d1d1f" }}>Final</span>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            {formatEGP(commission.finalAmountCents)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              fontFamily: apple,
              fontSize: "13px",
              fontWeight: 500,
              color: "#0071e3",
              background: "rgba(0,113,227,0.08)",
              border: "none",
              padding: "5px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.08)"; }}
          >
            Edit
          </button>
          {instructorId && (
            <button
              onClick={() => setPaidOpen(true)}
              style={{
                fontFamily: apple,
                fontSize: "13px",
                fontWeight: 500,
                color: "#ffffff",
                background: "#34c759",
                border: "none",
                padding: "5px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#2fb350"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#34c759"; }}
            >
              Mark Paid
            </button>
          )}
        </div>
      )}

      {isPending && (
        <CommissionEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          commission={commission}
        />
      )}
      {isPending && instructorId && (
        <MarkPaidDialog
          open={paidOpen}
          onOpenChange={setPaidOpen}
          commissionId={commission.id}
          instructorId={instructorId}
        />
      )}
    </div>
  );
}
