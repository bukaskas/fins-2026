import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/db/prisma";
import { OrderStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function fmtMoney(cents: number) {
  return `${(cents / 100).toLocaleString()} EGP`;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return format(d, "PPp");
}

function fmtDay(d: Date | null | undefined) {
  if (!d) return "—";
  return format(d, "PP");
}

function fmtDuration(start: Date, end: Date) {
  const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

  const [
    user,
    wallets,
    orders,
    payments,
    bookings,
    rentals,
    beachVisits,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    }),
    prisma.userWallet.findMany({
      where: { userId: id },
      select: { type: true, unit: true, balance: true },
    }),
    prisma.order.findMany({
      where: { userId: id },
      include: {
        lines: {
          include: {
            product: { select: { name: true, sku: true, type: true } },
          },
        },
        allocations: { select: { amountCents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: id },
      include: { allocations: { select: { orderId: true, amountCents: true } } },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.lessonBooking.findMany({
      where: { guestId: id },
      include: {
        session: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            lessonType: true,
            instructor: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rental.findMany({
      where: { guestId: id },
      include: {
        lines: {
          include: {
            inventoryItem: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
    }),
    prisma.beachVisit.findMany({
      where: { guestId: id },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!user) notFound();

  // Outstanding balance — mirrors listUnsettledOrders math.
  const outstandingCents = orders.reduce((sum, o) => {
    if (o.status !== OrderStatus.OPEN && o.status !== OrderStatus.PARTIAL) return sum;
    const paid = o.allocations.reduce((s, a) => s + a.amountCents, 0);
    return sum + Math.max(o.totalCents - paid, 0);
  }, 0);

  const lessonHours = wallets.find((w) => w.type === "LESSON_HOURS");
  const beachUse = wallets.find((w) => w.type === "BEACH_USE");

  const totalPaidCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const productLineCount = orders.reduce((s, o) => s + o.lines.length, 0);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/users" className="text-sm text-muted-foreground hover:underline">
          ← Users
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {user.name ?? "Unnamed user"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
              {" · joined "}
              {fmtDay(user.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-3 py-1 text-xs font-medium tracking-wide">
              {user.role}
            </span>
            <Link
              href={`/lessons/new?guestId=${user.id}`}
              className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-black/85 transition-colors"
            >
              + Lesson
            </Link>
            <Link
              href={`/accounting/new-payment?userId=${user.id}${
                outstandingCents > 0 ? `&amountCents=${outstandingCents}` : ""
              }`}
              className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-black/85 transition-colors"
            >
              + Payment
            </Link>
            <Link
              href={`/users/edit/${user.id}`}
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Lesson hours"
          value={lessonHours ? `${Number(lessonHours.balance).toFixed(2)}h` : "0.00h"}
        />
        <SummaryCard
          label="Beach uses"
          value={beachUse ? `${Number(beachUse.balance).toFixed(0)} entries` : "0 entries"}
        />
        <SummaryCard
          label="Outstanding"
          value={fmtMoney(outstandingCents)}
          tone={outstandingCents > 0 ? "warn" : "ok"}
        />
        <SummaryCard label="Total paid" value={fmtMoney(totalPaidCents)} />
      </div>

      {/* Products */}
      <Section title="Products" count={productLineCount}>
        {productLineCount === 0 ? (
          <EmptyMessage>No products purchased yet.</EmptyMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                <TableHead>Order status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.flatMap((o) =>
                o.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{fmtDate(o.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{line.product.name}</div>
                      <div className="text-xs text-muted-foreground">{line.product.sku}</div>
                    </TableCell>
                    <TableCell>{line.product.type}</TableCell>
                    <TableCell className="text-right">{line.qty}</TableCell>
                    <TableCell className="text-right">{fmtMoney(line.lineTotalCents)}</TableCell>
                    <TableCell>{o.status}</TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Lesson sessions */}
      <Section title="Lesson sessions" count={bookings.length}>
        {bookings.length === 0 ? (
          <EmptyMessage>No lesson sessions yet.</EmptyMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{fmtDate(b.session.startsAt)}</TableCell>
                  <TableCell>{b.session.lessonType.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    {b.session.instructor?.name ?? b.session.instructor?.email ?? "—"}
                  </TableCell>
                  <TableCell>{fmtDuration(b.session.startsAt, b.session.endsAt)}</TableCell>
                  <TableCell>{b.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Payments */}
      <Section title="Payments" count={payments.length}>
        {payments.length === 0 ? (
          <EmptyMessage>No payments recorded yet.</EmptyMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Allocated to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{fmtDate(p.receivedAt)}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-right">{fmtMoney(p.amountCents)}</TableCell>
                  <TableCell>{p.reference ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {p.allocations.length} order{p.allocations.length === 1 ? "" : "s"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Rentals */}
      <Section title="Rentals" count={rentals.length}>
        {rentals.length === 0 ? (
          <EmptyMessage>No rentals yet.</EmptyMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Starts</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.startsAt)}</TableCell>
                  <TableCell>{fmtDate(r.dueAt)}</TableCell>
                  <TableCell>{fmtDate(r.returnedAt)}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {r.lines.map((l) => (
                        <div key={l.id} className="text-xs">
                          {l.qty}× {l.inventoryItem.name}
                          <span className="text-muted-foreground"> ({l.inventoryItem.sku})</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.totalCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Beach visits */}
      <Section title="Beach visits" count={beachVisits.length}>
        {beachVisits.length === 0 ? (
          <EmptyMessage>No beach visits yet.</EmptyMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checked in</TableHead>
                <TableHead>Checked out</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beachVisits.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{fmtDay(v.visitDate)}</TableCell>
                  <TableCell>{v.type}</TableCell>
                  <TableCell>{v.status}</TableCell>
                  <TableCell>{fmtDate(v.checkedInAt)}</TableCell>
                  <TableCell>{fmtDate(v.checkedOutAt)}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{v.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const isWarn = tone === "warn";
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: isWarn ? "#fff7ed" : undefined,
        borderColor: isWarn ? "rgba(254, 215, 170, 0.7)" : undefined,
      }}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-xl font-semibold"
        style={{ color: isWarn ? "#9a3412" : undefined }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {title} <span className="text-muted-foreground font-normal">({count})</span>
      </h2>
      {children}
    </section>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
