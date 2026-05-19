"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  instructorId: string;
  from: string;
  to: string;
};

export function DownloadInvoiceButton({ instructorId, from, to }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/instructors/${instructorId}/invoice?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
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
      const filename = match?.[1] ?? "invoice.pdf";

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
      disabled={busy}
      className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
    >
      {busy ? "Generating…" : "Download Invoice"}
    </button>
  );
}
