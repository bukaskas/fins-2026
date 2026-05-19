"use client";

import { useMemo, useState } from "react";
import { createRental } from "@/lib/actions/rental.actions";

type Guest = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

type RentalProduct = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
};

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string | null;
  availableQty: number;
};

type EquipmentDraft = {
  inventoryItemId: string;
  name: string;
  qty: number;
};

type ProductLineDraft = {
  productId: string;
  productName: string;
  productSku: string;
  productPriceCents: number;
  qty: number;
  equipment: EquipmentDraft[];
};

export default function NewRentalForm({
  guests,
  rentalProducts,
  inventoryItems,
  initialGuestId,
}: {
  guests: Guest[];
  rentalProducts: RentalProduct[];
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

  // Product search (for adding new product blocks)
  const [productQuery, setProductQuery] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return rentalProducts.slice(0, 20);
    return rentalProducts
      .filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q))
      .slice(0, 20);
  }, [rentalProducts, productQuery]);

  // Product lines (each one has its own equipment list)
  const [productLines, setProductLines] = useState<ProductLineDraft[]>([]);

  // Track currently-selected inventory item per product block (for the picker)
  const [equipPickerState, setEquipPickerState] = useState<
    Record<number, { itemId: string; qty: number }>
  >({});

  // Available qty per item, after subtracting everything already allocated.
  const remainingByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventoryItems) {
      map.set(item.id, item.availableQty);
    }
    for (const pl of productLines) {
      for (const eq of pl.equipment) {
        map.set(eq.inventoryItemId, (map.get(eq.inventoryItemId) ?? 0) - eq.qty);
      }
    }
    return map;
  }, [inventoryItems, productLines]);

  function addProductLine(product: RentalProduct) {
    setProductLines((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productPriceCents: product.priceCents,
        qty: 1,
        equipment: [],
      },
    ]);
    setProductQuery("");
    setShowProductList(false);
  }

  function removeProductLine(idx: number) {
    setProductLines((prev) => prev.filter((_, i) => i !== idx));
    setEquipPickerState((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }

  function updateProductQty(idx: number, value: number) {
    if (!Number.isFinite(value) || value < 1) return;
    setProductLines((prev) =>
      prev.map((pl, i) => (i === idx ? { ...pl, qty: Math.floor(value) } : pl)),
    );
  }

  function addEquipment(idx: number) {
    const picker = equipPickerState[idx];
    if (!picker?.itemId || picker.qty < 1) return;
    const item = inventoryItems.find((i) => i.id === picker.itemId);
    if (!item) return;

    setProductLines((prev) =>
      prev.map((pl, i) => {
        if (i !== idx) return pl;
        if (pl.equipment.some((e) => e.inventoryItemId === picker.itemId)) {
          alert("Item already added to this product. Remove it first to change quantity.");
          return pl;
        }
        return {
          ...pl,
          equipment: [
            ...pl.equipment,
            {
              inventoryItemId: picker.itemId,
              name: `${item.name}${item.size ? ` (${item.size})` : ""}`,
              qty: picker.qty,
            },
          ],
        };
      }),
    );
    setEquipPickerState((prev) => ({ ...prev, [idx]: { itemId: "", qty: 1 } }));
  }

  function removeEquipment(plIdx: number, eqIdx: number) {
    setProductLines((prev) =>
      prev.map((pl, i) =>
        i === plIdx
          ? { ...pl, equipment: pl.equipment.filter((_, j) => j !== eqIdx) }
          : pl,
      ),
    );
  }

  function updateEquipmentQty(plIdx: number, eqIdx: number, value: number) {
    if (!Number.isFinite(value) || value < 1) return;
    setProductLines((prev) =>
      prev.map((pl, i) =>
        i === plIdx
          ? {
              ...pl,
              equipment: pl.equipment.map((eq, j) =>
                j === eqIdx ? { ...eq, qty: Math.floor(value) } : eq,
              ),
            }
          : pl,
      ),
    );
  }

  const productLinesForSubmit = productLines.map((pl) => ({
    productId: pl.productId,
    qty: pl.qty,
    equipment: pl.equipment.map((eq) => ({
      inventoryItemId: eq.inventoryItemId,
      qty: eq.qty,
    })),
  }));

  const totalCents = productLines.reduce(
    (sum, pl) => sum + pl.productPriceCents * pl.qty,
    0,
  );

  const hasEmptyEquipment = productLines.some((pl) => pl.equipment.length === 0);
  const submitDisabled =
    !selectedGuestId || productLines.length === 0 || hasEmptyEquipment;

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

      {/* Add rental product */}
      <div className="relative">
        <label className="mb-1 block text-sm font-medium">Add rental product</label>
        {rentalProducts.length === 0 ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No rental products defined. Create one in{" "}
            <a href="/products" className="underline">
              Products
            </a>{" "}
            with category set to Rental.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                setShowProductList(true);
              }}
              onFocus={() => setShowProductList(true)}
              placeholder="Search rental products by name or SKU"
              className="w-full rounded border px-3 py-2"
            />

            {showProductList && (
              <div className="mt-1 max-h-48 overflow-auto rounded border bg-white">
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No matches.
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductLine(p)}
                      className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {p.sku}
                          </div>
                        </div>
                        <div className="text-sm tabular-nums">
                          {(p.priceCents / 100).toFixed(2)} EGP
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product blocks */}
      {productLines.length > 0 && (
        <div className="space-y-4">
          {productLines.map((pl, plIdx) => {
            const picker = equipPickerState[plIdx] ?? { itemId: "", qty: 1 };
            return (
              <fieldset key={plIdx} className="rounded border p-3">
                <legend className="px-1 text-sm font-medium">
                  {pl.productName}{" "}
                  <span className="text-xs text-muted-foreground font-mono">
                    {pl.productSku}
                  </span>
                </legend>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={pl.qty}
                      onChange={(e) =>
                        updateProductQty(plIdx, Number(e.target.value))
                      }
                      className="w-20 rounded border px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">
                      × {(pl.productPriceCents / 100).toFixed(2)} ={" "}
                    </span>
                    <span className="font-medium tabular-nums">
                      {((pl.productPriceCents * pl.qty) / 100).toFixed(2)} EGP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductLine(plIdx)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove product
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-[1fr_80px_auto] gap-2">
                  <select
                    value={picker.itemId}
                    onChange={(e) =>
                      setEquipPickerState((prev) => ({
                        ...prev,
                        [plIdx]: { ...picker, itemId: e.target.value },
                      }))
                    }
                    className="rounded border px-3 py-2 text-sm"
                  >
                    <option value="">Select equipment...</option>
                    {inventoryItems.map((item) => {
                      const remaining = remainingByItem.get(item.id) ?? 0;
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.size ? ` (${item.size})` : ""} — {item.category} [
                          {remaining} avail]
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={picker.qty}
                    onChange={(e) =>
                      setEquipPickerState((prev) => ({
                        ...prev,
                        [plIdx]: { ...picker, qty: Number(e.target.value) },
                      }))
                    }
                    className="rounded border px-2 py-2 text-sm"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => addEquipment(plIdx)}
                    className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
                  >
                    Add
                  </button>
                </div>

                {pl.equipment.length > 0 ? (
                  <div className="mt-3 overflow-x-auto rounded border">
                    <table className="min-w-full text-sm">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-3 py-2 text-left">Equipment</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pl.equipment.map((eq, eqIdx) => (
                          <tr key={eqIdx} className="border-b last:border-b-0">
                            <td className="px-3 py-2">{eq.name}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min={1}
                                value={eq.qty}
                                onChange={(e) =>
                                  updateEquipmentQty(
                                    plIdx,
                                    eqIdx,
                                    Number(e.target.value),
                                  )
                                }
                                className="w-16 rounded border px-2 py-1 text-right text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeEquipment(plIdx, eqIdx)}
                                className="text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-700">
                    Add at least one equipment item to this product.
                  </p>
                )}
              </fieldset>
            );
          })}

          <div className="rounded border px-3 py-2 text-right text-sm">
            <span className="text-muted-foreground">Rental total: </span>
            <span className="font-medium tabular-nums">
              {(totalCents / 100).toFixed(2)} EGP
            </span>
          </div>
        </div>
      )}

      <input
        type="hidden"
        name="productLinesJson"
        value={JSON.stringify(productLinesForSubmit)}
      />

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
        disabled={submitDisabled}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Create Rental
      </button>
      <p className="text-xs text-muted-foreground">
        The rental clock starts when you submit this form. Equipment is recorded per
        product so you can see later which items were used with each one.
      </p>
    </form>
  );
}
