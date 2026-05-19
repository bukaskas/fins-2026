import { notFound } from "next/navigation";
import { getRentalById } from "@/lib/actions/rental.actions";
import { RentalStatusBadge } from "@/components/rentals/RentalStatusBadge";
import {
  ReturnRentalButton,
  CancelRentalButton,
} from "@/components/rentals/ReturnRentalButton";
import { ReturnRentalLineButton } from "@/components/rentals/ReturnRentalLineButton";
import { formatElapsed } from "@/lib/utils";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RentalDetailPage({ params }: Props) {
  const { id } = await params;
  const rental = await getRentalById(id);
  if (!rental) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rental Detail</h1>
        <Link
          href="/rentals"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Rentals
        </Link>
      </div>

      <div className="space-y-6">
        {/* Info */}
        <div className="rounded-md border p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Guest:</span>{" "}
              <span className="font-medium">
                {rental.guest.name || rental.guest.email}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <RentalStatusBadge status={rental.status} />
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Products:</span>{" "}
              <span className="font-medium">
                {rental.order.lines
                  .map((l) => `${l.qty}× ${l.product.name}`)
                  .join(", ") || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Start:</span>{" "}
              {new Date(rental.startsAt).toLocaleString()}
            </div>
            <div>
              <span className="text-muted-foreground">Open for:</span>{" "}
              {formatElapsed(
                rental.startsAt,
                rental.returnedAt ?? undefined,
              )}
            </div>
            {rental.returnedAt && (
              <div>
                <span className="text-muted-foreground">Returned:</span>{" "}
                {new Date(rental.returnedAt).toLocaleString()}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">
                {(rental.totalCents / 100).toFixed(2)} EGP
              </span>
            </div>
          </div>
          {rental.notes && (
            <p className="mt-3 text-sm text-muted-foreground">
              Notes: {rental.notes}
            </p>
          )}

          {(rental.status === "OPEN" || rental.status === "LATE") && (
            <div className="mt-4 flex gap-2">
              <ReturnRentalButton rentalId={rental.id} />
              {rental.status === "OPEN" && (
                <CancelRentalButton rentalId={rental.id} />
              )}
            </div>
          )}
        </div>

        {/* Products with their equipment */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Products & equipment</h2>
          {rental.order.lines.map((orderLine) => {
            const equipForLine = rental.lines.filter(
              (rl) => rl.orderLine.id === orderLine.id,
            );
            return (
              <div key={orderLine.id} className="rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                  <div>
                    <span className="font-medium">
                      {orderLine.qty}× {orderLine.product.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      {orderLine.product.sku}
                    </span>
                  </div>
                  <div className="text-sm tabular-nums">
                    {(orderLine.lineTotalCents / 100).toFixed(2)} EGP
                  </div>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-muted/10">
                    <tr>
                      <th className="px-3 py-2 text-left">Equipment</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-left">Returned</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipForLine.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-3 text-center text-muted-foreground"
                        >
                          No equipment recorded.
                        </td>
                      </tr>
                    ) : (
                      equipForLine.map((line) => {
                        const canReturn =
                          line.returnedAt === null &&
                          (rental.status === "OPEN" || rental.status === "LATE");
                        return (
                          <tr key={line.id} className="border-b last:border-b-0">
                            <td className="px-3 py-2">
                              {line.inventoryItem.name}
                              {line.inventoryItem.size
                                ? ` (${line.inventoryItem.size})`
                                : ""}
                            </td>
                            <td className="px-3 py-2">
                              {line.inventoryItem.category}
                            </td>
                            <td className="px-3 py-2 text-right">{line.qty}</td>
                            <td className="px-3 py-2">
                              {line.returnedAt
                                ? new Date(line.returnedAt).toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {canReturn && (
                                <ReturnRentalLineButton lineId={line.id} />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Movement history */}
        <div>
          <h2 className="mb-2 text-lg font-medium">Movement History</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-left">By</th>
                </tr>
              </thead>
              <tbody>
                {rental.lines.flatMap((line) =>
                  line.movements.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="px-3 py-2">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{m.type}</td>
                      <td className="px-3 py-2 text-right">{m.qty}</td>
                      <td className="px-3 py-2">{m.reason || "—"}</td>
                      <td className="px-3 py-2">
                        {m.actor?.name || m.actor?.email || "—"}
                      </td>
                    </tr>
                  )),
                )}
                {rental.lines.every((l) => l.movements.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      No movements recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
