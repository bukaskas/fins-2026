"use client";

import { useMemo, useState } from "react";
import { createRental } from "@/lib/actions/rental.actions";

type Guest = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string | null;
  availableQty: number;
};

type LineItem = {
  inventoryItemId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
};

export default function NewRentalForm({
  guests,
  inventoryItems,
  initialGuestId,
}: {
  guests: Guest[];
  inventoryItems: InventoryItem[];
  initialGuestId?: string;
}) {
  // Guest search
  const initialGuest = guests.find((g) => g.id === initialGuestId) ?? null;
  const [guestQuery, setGuestQuery] = useState(
    initialGuest ? `${initialGuest.name || ""} ${initialGuest.email}`.trim() : "",
  );
  const [selectedGuestId, setSelectedGuestId] = useState(initialGuest?.id ?? "");
  const [showGuestList, setShowGuestList] = useState(!initialGuest);

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    if (!q) return guests.slice(0, 20);
    return guests
      .filter((g) =>
        `${g.name ?? ""} ${g.email} ${g.phone ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [guests, guestQuery]);

  // Line items
  const [lines, setLines] = useState<LineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [linePrice, setLinePrice] = useState("");

  function addLine() {
    if (!selectedItemId) return;
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    const priceCents = Math.round(Number(linePrice) * 100);
    if (priceCents < 0 || isNaN(priceCents)) return;

    // Check if already added
    if (lines.some((l) => l.inventoryItemId === selectedItemId)) {
      alert("Item already added. Remove it first to change quantity.");
      return;
    }

    setLines([
      ...lines,
      {
        inventoryItemId: selectedItemId,
        name: `${item.name}${item.size ? ` (${item.size})` : ""}`,
        qty: lineQty,
        unitPriceCents: priceCents,
      },
    ]);
    setSelectedItemId("");
    setLineQty(1);
    setLinePrice("");
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  const totalCents = lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0);

  // Serialize lines for form submission
  const linesForSubmit = lines.map(({ inventoryItemId, qty, unitPriceCents }) => ({
    inventoryItemId,
    qty,
    unitPriceCents,
  }));

  return (
    <form action={createRental} className="space-y-4 rounded-md border p-4">
      {/* Guest search */}
      <div className="relative">
        <label className="mb-1 block text-sm font-medium">Guest</label>
        <input
          type="text"
          value={guestQuery}
          onChange={(e) => {
            setGuestQuery(e.target.value);
            setSelectedGuestId("");
            setShowGuestList(true);
          }}
          onFocus={() => setShowGuestList(true)}
          placeholder="Search by name, phone, or email"
          className="w-full rounded border px-3 py-2"
        />
        <input type="hidden" name="guestId" value={selectedGuestId} />

        {showGuestList && (
          <div className="mt-1 max-h-48 overflow-auto rounded border bg-white">
            {filteredGuests.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedGuestId(g.id);
                  setGuestQuery(
                    `${g.name || "Unnamed"} • ${g.email}${g.phone ? ` • ${g.phone}` : ""}`,
                  );
                  setShowGuestList(false);
                }}
                className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
              >
                <div className="font-medium">{g.name || "Unnamed"}</div>
                <div className="text-xs text-muted-foreground">
                  {g.email} {g.phone ? `• ${g.phone}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Start</label>
          <input
            type="datetime-local"
            name="startsAt"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Due back</label>
          <input
            type="datetime-local"
            name="dueAt"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
      </div>

      {/* Add item */}
      <fieldset className="rounded border p-3">
        <legend className="px-1 text-sm font-medium">Add Equipment</legend>
        <div className="grid grid-cols-[1fr_80px_120px_auto] gap-2">
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Select item...</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}{item.size ? ` (${item.size})` : ""} — {item.category} [{item.availableQty} avail]
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={lineQty}
            onChange={(e) => setLineQty(Number(e.target.value))}
            className="rounded border px-2 py-2 text-sm"
            placeholder="Qty"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={linePrice}
            onChange={(e) => setLinePrice(e.target.value)}
            className="rounded border px-2 py-2 text-sm"
            placeholder="Price (EGP)"
          />
          <button
            type="button"
            onClick={addLine}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
          >
            Add
          </button>
        </div>
      </fieldset>

      {/* Lines table */}
      {lines.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2">{line.name}</td>
                  <td className="px-3 py-2 text-right">{line.qty}</td>
                  <td className="px-3 py-2 text-right">
                    {(line.unitPriceCents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {((line.qty * line.unitPriceCents) / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td colSpan={3} className="px-3 py-2 text-right">
                  Total
                </td>
                <td className="px-3 py-2 text-right">
                  {(totalCents / 100).toFixed(2)} EGP
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <input type="hidden" name="linesJson" value={JSON.stringify(linesForSubmit)} />

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="w-full rounded border px-3 py-2"
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={lines.length === 0 || !selectedGuestId}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Create Rental
      </button>
    </form>
  );
}
