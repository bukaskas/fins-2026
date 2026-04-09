import Link from "next/link";
import { getAllInventoryItems } from "@/lib/actions/inventory.actions";

export default async function InventoryPage() {
  const items = await getAllInventoryItems();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Link
          href="/inventory/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Add Item
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Size</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Available</th>
              <th className="px-3 py-2 text-left">Condition</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No inventory items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b ${item.availableQty === 0 ? "bg-red-50" : ""}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.category}</td>
                  <td className="px-3 py-2">{item.size || "—"}</td>
                  <td className="px-3 py-2 text-right">{item.totalQty}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={
                        item.availableQty === 0
                          ? "font-medium text-red-600"
                          : ""
                      }
                    >
                      {item.availableQty}
                    </span>
                  </td>
                  <td className="px-3 py-2">{item.condition}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/inventory/${item.id}`}
                      className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
