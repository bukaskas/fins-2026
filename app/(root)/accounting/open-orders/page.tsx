import Link from "next/link";
import { listUnsettledOrders } from "@/lib/actions/order.actions";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(cents / 100);
}

export default async function OpenOrdersPage() {
  const grouped = await listUnsettledOrders();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">
        Unsettled Payments by Guest
      </h1>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No unsettled balances found.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <section key={g.user.id} className="rounded-md border">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <div className="font-medium">
                    {g.user.name || "Unnamed guest"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {g.user.email}
                  </div>
                  {g.user.phone ? (
                    <div className="text-xs text-muted-foreground">
                      {g.user.phone}
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Total outstanding
                  </div>
                  <div className="text-lg font-semibold">
                    {money(g.totalOutstandingCents)}
                  </div>
                  <Link
                    href={`/accounting/new-payment?userId=${g.user.id}&amountCents=${g.totalOutstandingCents}`}
                    className="mt-2 inline-block rounded bg-black px-3 py-1.5 text-xs text-white"
                  >
                    Go to payment
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Order</th>
                      <th className="px-3 py-2 text-left">Created</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Paid</th>
                      <th className="px-3 py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.orders.map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">
                          {o.id.slice(0, 8)}...
                        </td>
                        <td className="px-3 py-2">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{o.status}</td>
                        <td className="px-3 py-2 text-right">
                          {money(o.totalCents)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(o.paidCents)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {money(o.dueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
