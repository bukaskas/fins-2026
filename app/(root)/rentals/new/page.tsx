import NewRentalForm from "@/components/rentals/NewRentalForm";
import { getAvailableInventoryItems } from "@/lib/actions/inventory.actions";
import { getRentalFormUsers } from "@/lib/actions/rental.actions";

type Props = {
  searchParams: Promise<{ guestId?: string }>;
};

export default async function NewRentalPage({ searchParams }: Props) {
  const { guestId } = await searchParams;
  const [guests, inventoryItems] = await Promise.all([
    getRentalFormUsers(),
    getAvailableInventoryItems(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">New Rental</h1>

      {inventoryItems.length === 0 ? (
        <p className="text-muted-foreground">
          No inventory items available. Add items in the{" "}
          <a href="/inventory/new" className="underline">
            inventory section
          </a>{" "}
          first.
        </p>
      ) : (
        <NewRentalForm
          guests={guests}
          inventoryItems={inventoryItems}
          initialGuestId={guestId}
        />
      )}
    </main>
  );
}
