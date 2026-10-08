import Link from "next/link";
import { getAllRentals, markOverdueRentals } from "@/lib/actions/rental.actions";
import { RentalStatusBadge } from "@/components/rentals/RentalStatusBadge";
import { ReturnRentalButton } from "@/components/rentals/ReturnRentalButton";
import { formatElapsed } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function RentalsPage() {
  await markOverdueRentals();
  const rentals = await getAllRentals();
  // The guide page is ADMIN-only; don't offer a link that bounces everyone else.
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rentals</h1>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link
              href="/rentals/guide"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Rental guide
            </Link>
          )}
          <Link
            href="/rentals/new"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            New Rental
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Guest</th>
              <th className="px-3 py-2 text-left">Products</th>
              <th className="px-3 py-2 text-left">Equipment</th>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">Open for</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No rentals found.
                </td>
              </tr>
            ) : (
              rentals.map((rental) => (
                <tr key={rental.id} className="border-b">
                  <td className="px-3 py-2">
                    {rental.guest.name || rental.guest.email}
                  </td>
                  <td className="px-3 py-2">
                    {rental.order.lines
                      .map((l) => `${l.qty}× ${l.product.name}`)
                      .join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    {rental.lines
                      .map(
                        (l) =>
                          `${l.inventoryItem.name}${l.inventoryItem.size ? ` (${l.inventoryItem.size})` : ""} x${l.qty}`,
                      )
                      .join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(rental.startsAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {formatElapsed(
                      rental.startsAt,
                      rental.returnedAt ?? undefined,
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <RentalStatusBadge status={rental.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(rental.totalCents / 100).toFixed(2)} EGP
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/rentals/${rental.id}`}
                        className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40"
                      >
                        View
                      </Link>
                      {(rental.status === "OPEN" || rental.status === "LATE") && (
                        <ReturnRentalButton rentalId={rental.id} />
                      )}
                    </div>
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
