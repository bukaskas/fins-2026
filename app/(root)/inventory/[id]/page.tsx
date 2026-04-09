import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getInventoryItemById,
  updateInventoryItem,
  adjustInventoryQty,
} from "@/lib/actions/inventory.actions";
import InventoryItemForm from "@/components/inventory/InventoryItemForm";
import { MovementHistory } from "@/components/inventory/MovementHistory";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InventoryItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getInventoryItemById(id);
  if (!item) return notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateInventoryItem(id, formData);
  }

  async function handleAdjust(formData: FormData) {
    "use server";
    await adjustInventoryQty(formData);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.name}</h1>
        <Link
          href="/inventory"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Inventory
        </Link>
      </div>

      <div className="space-y-6">
        {/* Info */}
        <div className="rounded-md border p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">SKU:</span>{" "}
              <span className="font-mono">{item.sku}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>{" "}
              {item.category}
            </div>
            <div>
              <span className="text-muted-foreground">Total Qty:</span>{" "}
              {item.totalQty}
            </div>
            <div>
              <span className="text-muted-foreground">Available:</span>{" "}
              <span
                className={
                  item.availableQty === 0 ? "font-medium text-red-600" : ""
                }
              >
                {item.availableQty}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Condition:</span>{" "}
              {item.condition}
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>{" "}
              {item.size || "—"}
            </div>
          </div>
        </div>

        {/* Edit */}
        <div>
          <h2 className="mb-2 text-lg font-medium">Edit Item</h2>
          <InventoryItemForm
            action={handleUpdate}
            defaultValues={{
              sku: item.sku,
              name: item.name,
              category: item.category,
              size: item.size,
              totalQty: item.totalQty,
              condition: item.condition,
            }}
            submitLabel="Update"
          />
        </div>

        {/* Stock Adjustment */}
        <div>
          <h2 className="mb-2 text-lg font-medium">Stock Adjustment</h2>
          <form
            action={handleAdjust}
            className="flex items-end gap-3 rounded-md border p-4"
          >
            <input type="hidden" name="itemId" value={item.id} />
            <div>
              <label className="mb-1 block text-sm">Adjustment (+/-)</label>
              <input
                type="number"
                name="adjustment"
                className="w-24 rounded border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Type</label>
              <select
                name="type"
                className="rounded border px-3 py-2"
                defaultValue="ADJUSTMENT"
              >
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="IN">Stock In</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm">Reason</label>
              <input
                name="reason"
                className="w-full rounded border px-3 py-2"
                placeholder="Optional reason"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Adjust
            </button>
          </form>
        </div>

        {/* Movement History */}
        <div>
          <h2 className="mb-2 text-lg font-medium">Movement History</h2>
          <MovementHistory movements={item.movements} />
        </div>
      </div>
    </main>
  );
}
