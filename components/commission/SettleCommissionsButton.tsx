"use client";

import { useState } from "react";
import { SettleCommissionsDialog } from "./SettleCommissionsDialog";

type Props = {
  instructorId: string;
  from: string; // ISO
  to: string; // ISO
  pendingCount: number;
  pendingCents: number;
  periodLabel: string;
};

export function SettleCommissionsButton({
  instructorId,
  from,
  to,
  pendingCount,
  pendingCents,
  periodLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const disabled = pendingCount === 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="rounded border px-3 py-1.5 text-sm bg-foreground text-background hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Settle Commissions
      </button>
      {open && (
        <SettleCommissionsDialog
          open={open}
          onOpenChange={setOpen}
          instructorId={instructorId}
          from={new Date(from)}
          to={new Date(to)}
          pendingCount={pendingCount}
          pendingCents={pendingCents}
          periodLabel={periodLabel}
        />
      )}
    </>
  );
}
