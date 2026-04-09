import InventoryItemForm from "@/components/inventory/InventoryItemForm";
import { createInventoryItem } from "@/lib/actions/inventory.actions";
import { redirect } from "next/navigation";

async function handleCreate(formData: FormData) {
  "use server";
  await createInventoryItem(formData);
  redirect("/inventory");
}

export default function NewInventoryItemPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Inventory Item</h1>
      <InventoryItemForm action={handleCreate} submitLabel="Create Item" />
    </main>
  );
}
