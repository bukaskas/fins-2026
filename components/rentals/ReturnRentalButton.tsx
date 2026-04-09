"use client";

import { useState } from "react";
import { returnRental, cancelRental } from "@/lib/actions/rental.actions";

export function ReturnRentalButton({ rentalId }: { rentalId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    if (!confirm("Mark this rental as returned?")) return;
    setLoading(true);
    try {
      await returnRental(rentalId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to return rental.");
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
      {loading ? "Returning..." : "Return"}
    </button>
  );
}

export function CancelRentalButton({ rentalId }: { rentalId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel this rental? Inventory will be restored.")) return;
    setLoading(true);
    try {
      await cancelRental(rentalId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel rental.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {loading ? "Canceling..." : "Cancel"}
    </button>
  );
}
