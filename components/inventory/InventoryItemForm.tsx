"use client";

import { InventoryCategory, ItemCondition } from "@prisma/client";

export default function InventoryItemForm({
  action,
  defaultValues,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    sku?: string;
    name?: string;
    category?: string;
    size?: string | null;
    totalQty?: number;
    condition?: string;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-3 rounded-md border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">SKU</label>
        <input
          name="sku"
          defaultValue={defaultValues?.sku}
          className="w-full rounded border px-3 py-2"
          required
          readOnly={!!defaultValues?.sku}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          name="name"
          defaultValue={defaultValues?.name}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            name="category"
            defaultValue={defaultValues?.category ?? "OTHER"}
            className="w-full rounded border px-3 py-2"
            required
          >
            {Object.values(InventoryCategory).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Size</label>
          <input
            name="size"
            defaultValue={defaultValues?.size ?? ""}
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. 12m, M, 140cm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Total Quantity</label>
          <input
            type="number"
            name="totalQty"
            min={0}
            defaultValue={defaultValues?.totalQty ?? 1}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Condition</label>
          <select
            name="condition"
            defaultValue={defaultValues?.condition ?? "GOOD"}
            className="w-full rounded border px-3 py-2"
          >
            {Object.values(ItemCondition).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
