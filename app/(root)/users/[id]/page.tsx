import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/db/prisma";
import { OrderStatus, ProductCategory, ProductType, UserType } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInstructors } from "@/lib/actions/user.actions";
import { getAllProducts } from "@/lib/actions/product.actions";
import UserDetailActionsBar from "@/components/users/UserDetailActionsBar";
import UserLessonSessionRow from "@/components/users/UserLessonSessionRow";
import EditOrderTrigger from "@/components/users/EditOrderTrigger";
import type { LessonProductOption } from "@/components/lessons/NewLessonForm";
import type {
  EditSheetServiceProduct,
  SessionRow,
} from "@/components/lessons/LessonSessionEditSheet";
import type { ProductSearchOption } from "@/components/products/ProductSearchField";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function fmtMoney(cents: number) {
  return `${(cents / 100).toLocaleString()} EGP`;
}

function fmtQty(qty: { toString: () => string } | number) {
  const n = typeof qty === "number" ? qty : Number(qty.toString());
  if (Number.isInteger(n)) return n.toString();
  // up to 4 decimals, strip trailing zeros.
  return n.toFixed(4).replace(/\.?0+$/, "");
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return format(d, "PPp");
}

function fmtDay(d: Date | null | undefined) {
  if (!d) return "—";
  return format(d, "PP");
}

// Customer standing badge styling. Level 1 is the default/neutral case.
const USER_TYPE_BADGE: Record<UserType, { label: string; bg: string; text: string; ring: string }> = {
  [UserType.LEVEL_1]:   { label: "Level 1 · Good customer", bg: "#E2F0E6", text: "#1F5B36", ring: "#BFDDC8" },
  [UserType.LEVEL_2]:   { label: "Level 2 · Limit when 50+", bg: "#FFF4E0", text: "#7A5414", ring: "#F2D9A6" },
  [UserType.LEVEL_3]:   { label: "Level 3 · No Fridays",     bg: "#FCE6D5", text: "#7A3E18", ring: "#F1C9AA" },
  [UserType.BLACKLIST]: { label: "Blacklist",                bg: "#FBE3E1", text: "#7E2A23", ring: "#F1C0BB" },
};

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
    instructors,
    lessonProductsRaw,
    allProductsRaw,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, userType: true, createdAt: true },
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
            product: { select: { id: true, name: true, sku: true, type: true, priceCents: true } },
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
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            bookings: {
              include: {
                guest: { select: { id: true, name: true, email: true, phone: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            commission: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rental.findMany({
      where: { guestId: id },
      include: {
        order: {
          include: {
            lines: {
              include: { product: { select: { name: true, sku: true } } },
            },
          },
        },
        lines: {
          include: {
            inventoryItem: { select: { name: true, sku: true } },
            orderLine: { select: { id: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
    }),
    prisma.beachVisit.findMany({
      where: { guestId: id },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
    listInstructors(),
    getAllProducts({ category: ProductCategory.LESSONS, isActive: true }),
    getAllProducts({ isActive: true }),
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

  const lessonProducts: LessonProductOption[] = lessonProductsRaw
    .filter((p) => p.lessonType != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      priceCents: p.priceCents,
      lessonType: p.lessonType!,
      referenceDurationMinutes: p.referenceDurationMinutes,
    }));

  // The edit sheet needs lesson products in the EditSheetServiceProduct shape.
  const editSheetServiceProducts: EditSheetServiceProduct[] = lessonProductsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
    category: p.category,
    lessonType: p.lessonType,
    referenceDurationMinutes: p.referenceDurationMinutes,
  }));

  const allProducts: ProductSearchOption[] = allProductsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    priceCents: p.priceCents,
    type: p.type,
  }));

  // De-dupe sessions in case a guest has multiple bookings on the same session.
  const sessionRowMap = new Map<string, { row: SessionRow; bookingStatus: string }>();
  for (const b of bookings) {
    if (sessionRowMap.has(b.session.id)) continue;
    sessionRowMap.set(b.session.id, {
      bookingStatus: b.status,
      row: {
        id: b.session.id,
        startsAt: b.session.startsAt.toISOString(),
        endsAt: b.session.endsAt.toISOString(),
        lessonType: b.session.lessonType,
        capacity: b.session.capacity,
        notes: b.session.notes,
        instructor: b.session.instructor,
        bookings: b.session.bookings.map((bk) => ({
          id: bk.id,
          status: bk.status,
          guest: bk.guest,
        })),
        commission: b.session.commission
          ? {
              id: b.session.commission.id,
              commissionType: b.session.commission.commissionType,
              durationMinutes: b.session.commission.durationMinutes,
              rateAtCreationCents: b.session.commission.rateAtCreationCents,
              calculatedAmountCents: b.session.commission.calculatedAmountCents,
              overrideAmountCents: b.session.commission.overrideAmountCents,
              finalAmountCents: b.session.commission.finalAmountCents,
              status: b.session.commission.status,
            }
          : null,
      },
    });
  }
  const sessionRows = Array.from(sessionRowMap.values());

  const initialLessonHoursBalance = lessonHours ? Number(lessonHours.balance) : 0;

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
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium tracking-wide"
              style={{
                background: USER_TYPE_BADGE[user.userType].bg,
                color: USER_TYPE_BADGE[user.userType].text,
                borderColor: USER_TYPE_BADGE[user.userType].ring,
              }}
            >
              {USER_TYPE_BADGE[user.userType].label}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium tracking-wide">
              {user.role}
            </span>
            <UserDetailActionsBar
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
              }}
              instructors={instructors}
              lessonProducts={lessonProducts}
              allProducts={allProducts}
              initialBalance={initialLessonHoursBalance}
            />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.flatMap((o) => {
                const hasBundleCredit = o.lines.some(
                  (l) => l.product.type === ProductType.BUNDLE_CREDIT,
                );
                const hasAllocations = o.allocations.length > 0;
                const canEdit = o.status === OrderStatus.OPEN && !hasBundleCredit;
                const canCancel = o.status === OrderStatus.OPEN && !hasAllocations;
                const editReason = !canEdit
                  ? o.status !== OrderStatus.OPEN
                    ? `Order is ${o.status.toLowerCase()}`
                    : "Order contains bundle credit lines"
                  : undefined;
                const cancelReason = !canCancel
                  ? o.status !== OrderStatus.OPEN
                    ? `Order is ${o.status.toLowerCase()}`
                    : "Order has payment allocations"
                  : undefined;
                return o.lines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell>{fmtDate(o.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{line.product.name}</div>
                      <div className="text-xs text-muted-foreground">{line.product.sku}</div>
                    </TableCell>
                    <TableCell>{line.product.type}</TableCell>
                    <TableCell className="text-right">{fmtQty(line.qty)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(line.lineTotalCents)}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell className="text-right">
                      {idx === 0 && (
                        <EditOrderTrigger
                          orderId={o.id}
                          initialLines={o.lines.map((l) => ({
                            productId: l.product.id,
                            name: l.product.name,
                            sku: l.product.sku,
                            unitPriceCents: l.unitPriceCents,
                            qty: Number(l.qty),
                          }))}
                          products={allProducts}
                          canEdit={canEdit}
                          canCancel={canCancel}
                          editReason={editReason}
                          cancelReason={cancelReason}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Lesson sessions */}
      <Section title="Lesson sessions" count={sessionRows.length}>
        {sessionRows.length === 0 ? (
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
              {sessionRows.map(({ row, bookingStatus }) => (
                <UserLessonSessionRow
                  key={row.id}
                  session={row}
                  bookingStatus={bookingStatus}
                  instructors={instructors}
                  serviceProducts={editSheetServiceProducts}
                />
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
                <TableHead>Products & equipment</TableHead>
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
                    <div className="space-y-2">
                      {r.order.lines.map((ol) => {
                        const equip = r.lines.filter(
                          (l) => l.orderLine.id === ol.id,
                        );
                        return (
                          <div key={ol.id}>
                            <div className="text-xs font-medium">
                              {fmtQty(ol.qty)}× {ol.product.name}
                              <span className="text-muted-foreground">
                                {" "}({ol.product.sku})
                              </span>
                            </div>
                            {equip.length > 0 && (
                              <ul className="ml-3 list-disc text-xs text-muted-foreground">
                                {equip.map((l) => (
                                  <li key={l.id}>
                                    {l.qty}× {l.inventoryItem.name} ({l.inventoryItem.sku})
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
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
