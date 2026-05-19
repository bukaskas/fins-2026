import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function RentalGuidePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session) {
    redirect("/signin");
  }

  if (role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Rental System Guide</h1>
        <p className="text-muted-foreground">
          Internal admin guide for rentals, inventory flow, and payment
          handling.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Prerequisites</h2>
        <p>Before creating a rental, you need:</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>
            <strong>Inventory items</strong> in the system (at least one with
            available stock)
          </li>
          <li>
            <strong>A registered guest</strong> (user account) to rent equipment
            to
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Step 1: Add Inventory Items</h2>
        <p>If this is your first time, add equipment to the inventory:</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Go to Admin &gt; Inventory (or navigate to /inventory)</li>
          <li>Click Add Item</li>
          <li>
            Fill in SKU, Name, Category, optional Size, Total Quantity, and
            Condition
          </li>
          <li>Click Create Item</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          The item&apos;s available quantity is automatically set to match total
          quantity.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 2: Create a Rental</h2>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">Option A: From Add Services</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Go to Admin &gt; Add Services (/register)</li>
            <li>Search for the guest</li>
            <li>
              Click Add Rental on their card to open the rental form with guest
              pre-selected
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Option B: From Rentals</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Go to Admin &gt; Rentals (/rentals)</li>
            <li>Click New Rental</li>
            <li>Search and select the guest manually</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Filling Out The Rental Form</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Guest: search by name, email, or phone and select</li>
            <li>
              Add one or more rental products. Each product becomes its own
              block on the form with its own quantity and equipment list.
            </li>
            <li>
              Inside each product block, pick the equipment used with that
              product (kite, bar, board, etc.) and the quantity for each item
            </li>
            <li>
              Repeat for additional products if the same guest is taking out
              multiple rentals at once
            </li>
            <li>Add optional notes</li>
            <li>Click Create Rental — the rental clock starts on submit</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Equipment is recorded per product so you can later see exactly which
            inventory items were used with each product purchase.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">What Happens On Submit</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Rental record is created with status Active</li>
            <li>Inventory stock (availableQty) is decremented</li>
            <li>Inventory movement (OUT) is logged for each item</li>
            <li>Open order is created in accounting for rental total</li>
            <li>You are redirected to the rentals list</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Step 3: Managing Rentals</h2>
        <p>
          View all rentals in Admin &gt; Rentals (/rentals). The table shows
          guest, items, dates, status, and total.
        </p>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Rental Statuses</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Active (blue): equipment is currently rented out</li>
            <li>Overdue (red): rental has been open more than 4 hours</li>
            <li>Returned (green): all items have been returned</li>
            <li>Canceled (gray): rental was canceled</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Overdue detection runs automatically when visiting the rentals page.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Returning Equipment</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              Open the rental detail page and click Mark returned on each item
              as it comes back
            </li>
            <li>
              Or click Return on the rentals list / detail page to return every
              remaining item at once
            </li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Each item logs an IN movement and restores stock when returned. The
            rental flips to Returned once every item has come back.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Canceling A Rental</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Open an active rental detail</li>
            <li>Click Cancel</li>
            <li>Confirm cancellation</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Canceling also restores inventory stock.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Step 4: Payment</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Rental creation automatically generates an open order</li>
          <li>Go to Admin &gt; Open Orders (/accounting/open-orders)</li>
          <li>Use the existing payment flow to settle charges</li>
          <li>Supported methods: Cash, Card, Transfer, or Discount</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Inventory Management</h2>
        <p>
          Open Admin &gt; Inventory (/inventory). Items with zero available
          stock are highlighted in red.
        </p>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Editing An Item</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Edit name, category, size, or condition</li>
            <li>Make stock adjustments with a reason</li>
            <li>Review movement history for checkouts, returns, adjustments</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Stock Adjustments</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Positive number adds stock, negative removes stock</li>
            <li>Types: Adjustment, Stock In, Maintenance, or Lost</li>
            <li>Optional reason can be added before submitting</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
