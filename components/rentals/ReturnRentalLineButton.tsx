"use client";

import { useState } from "react";
import { returnRentalLine } from "@/lib/actions/rental.actions";

export function ReturnRentalLineButton({ lineId }: { lineId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    if (!confirm("Mark this item as returned?")) return;
    setLoading(true);
    try {
      await returnRentalLine(lineId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to return item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReturn}
      disabled={loading}
      className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {loading ? "Returning..." : "Mark returned"}
    </button>
  );
}
