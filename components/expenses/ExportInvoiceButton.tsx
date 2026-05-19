"use client";

import { useState } from "react";
import { toast } from "sonner";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

type Props = {
  payeeId: string;
  disabled?: boolean;
};

export function ExportInvoiceButton({ payeeId, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/expenses/invoice?payeeId=${encodeURIComponent(payeeId)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? "Failed to generate invoice");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "expense-statement.pdf";

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download invoice"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || disabled}
      style={{
        fontFamily: apple,
        fontSize: "14px",
        fontWeight: 500,
        color: "#0071e3",
        background: "transparent",
        border: "0.5px solid #0071e3",
        padding: "7px 16px",
        borderRadius: "980px",
        cursor: busy || disabled ? "not-allowed" : "pointer",
        letterSpacing: "-0.01em",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!busy && !disabled)
          e.currentTarget.style.background = "rgba(0,113,227,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {busy ? "Generating…" : "Export PDF"}
    </button>
  );
}
