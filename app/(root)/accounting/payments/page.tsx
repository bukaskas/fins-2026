import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listPaymentsGroupedByMethod } from "@/lib/actions/payment.actions";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(cents / 100);
}

export default async function PaymentsPage() {
  const groups = await listPaymentsGroupedByMethod();
  console.log(groups);
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Payments</h1>

      <div>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              $1,250.00
            </CardTitle>
            <CardAction>
              <Badge variant="outline">+12.5%</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm"></CardFooter>
        </Card>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments found.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.method} className="rounded-md border">
              <div className="flex items-center justify-between border-b p-4">
                <div className="font-medium">{g.method}</div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {g.count} payment(s)
                  </div>
                  <div className="font-semibold">{money(g.totalCents)}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Guest</th>
                      <th className="px-3 py-2 text-left">Reference</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.payments.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">
                          {new Date(p.receivedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div>{p.user.name || "Unnamed guest"}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.user.email}
                          </div>
                        </td>
                        <td className="px-3 py-2">{p.reference || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          {money(p.amountCents)}
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
