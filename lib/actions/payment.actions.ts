"use server";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type CreateOrderItemInput = {
  productId: string;
  qty: number;
};

type CreateOrderForUserInput = {
  userId: string;
  items: CreateOrderItemInput[];
};

type SettleUserBalanceInput = {
  userId: string;
  amountCents: number;
  method: string; // "CASH" | "CARD" | "TRANSFER" ...
  reference?: string;
};

type ConsumeBundleUnitInput = {
  userId: string;
  productId?: string; // optional: consume from specific bundle product
  units?: number; // default 1
  bookingId?: string;
};

function toInt(n: number) {
  return Math.trunc(n);
}

export async function createOrderForUser(input: CreateOrderForUserInput) {
  const { userId, items } = input;

  if (!items.length) {
    throw new Error("Order must contain at least one item.");
  }

  return prisma.$transaction(async (tx) => {
    // Ensure user exists
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new Error("User not found.");

    // Load products
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products are invalid/inactive.");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build line payload
    const lines = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const qty = toInt(item.qty);
      if (qty <= 0) throw new Error("Quantity must be > 0.");

      const unitPriceCents = toInt(product.priceCents);
      const lineTotalCents = unitPriceCents * qty;

      return {
        productId: product.id,
        qty,
        unitPriceCents,
        lineTotalCents,
        creditUnitsEach: product.type === "BUNDLE_CREDIT" ? (product.creditUnits ?? 0) : null,
      };
    });

    const totalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

    // Create order + lines
    const order = await tx.order.create({
      data: {
        userId,
        totalCents,
        status: "OPEN",
        lines: { create: lines },
      },
      include: { lines: true },
    });

    // Create credit grants for bundle lines
    for (const line of order.lines) {
      const product = productMap.get(line.productId)!;
      if (product.type !== "BUNDLE_CREDIT") continue;

      const totalUnits = (line.creditUnitsEach ?? 0) * line.qty;
      if (totalUnits <= 0) continue;

      const expiresAt =
        product.creditValidDays && product.creditValidDays > 0
          ? new Date(Date.now() + product.creditValidDays * 24 * 60 * 60 * 1000)
          : null;

      await tx.userCreditGrant.create({
        data: {
          userId,
          productId: product.id,
          orderLineId: line.id,
          totalUnits,
          remainingUnits: totalUnits,
          expiresAt,
        },
      });
    }

    return order;
  });
}


export async function consumeBundleUnit(input: ConsumeBundleUnitInput) {
  const { userId, productId, bookingId } = input;
  const units = toInt(input.units ?? 1);
  if (units <= 0) throw new Error("Units must be > 0.");

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // find an eligible grant (soonest expiry first)
    const grant = await tx.userCreditGrant.findFirst({
      where: {
        userId,
        ...(productId ? { productId } : {}),
        remainingUnits: { gte: units },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
    });

    if (!grant) {
      throw new Error("No available bundle credits.");
    }

    // race-safe decrement
    const updated = await tx.userCreditGrant.updateMany({
      where: {
        id: grant.id,
        remainingUnits: { gte: units },
      },
      data: {
        remainingUnits: { decrement: units },
      },
    });

    if (updated.count === 0) {
      throw new Error("Credit was consumed by another request. Please retry.");
    }

    const usage = await tx.userCreditUsage.create({
      data: {
        grantId: grant.id,
        userId,
        unitsUsed: units,
        bookingId: bookingId ?? null,
      },
    });

    const refreshed = await tx.userCreditGrant.findUnique({
      where: { id: grant.id },
      select: { remainingUnits: true, totalUnits: true, productId: true, expiresAt: true },
    });

    return {
      usageId: usage.id,
      grantId: grant.id,
      remainingUnits: refreshed?.remainingUnits ?? 0,
      totalUnits: refreshed?.totalUnits ?? 0,
      productId: refreshed?.productId,
      expiresAt: refreshed?.expiresAt ?? null,
    };
  });

}
// Payment settlement logic
// Compare both functions: settleUserBalance and submitPaymentFromForm. The former is the core logic that applies a payment to a user's outstanding orders, while the latter is a helper that extracts form data and calls the settlement function.
export async function settleUserBalance(input: SettleUserBalanceInput) {
  const { userId, amountCents, method, reference } = input;
  const paymentAmount = toInt(amountCents);

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be > 0.");
  }

  return prisma.$transaction(async (tx) => {
    // Ensure user exists
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new Error("User not found.");

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        userId,
        amountCents: paymentAmount,
        method,
        reference: reference ?? null,
      },
    });

    // Find unpaid/partially paid orders oldest first
    const orders = await tx.order.findMany({
      where: { userId, status: { in: ["OPEN", "PARTIAL"] } },
      orderBy: { createdAt: "asc" },
      include: { allocations: true },
    });

    let remaining = paymentAmount;
    const allocations: Array<{ orderId: string; amountCents: number }> = [];

    for (const order of orders) {
      if (remaining <= 0) break;

      const alreadyPaid = order.allocations.reduce((s, a) => s + a.amountCents, 0);
      const outstanding = order.totalCents - alreadyPaid;
      if (outstanding <= 0) continue;

      const alloc = Math.min(outstanding, remaining);
      allocations.push({ orderId: order.id, amountCents: alloc });
      remaining -= alloc;
    }

    // Persist allocations
    for (const a of allocations) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          orderId: a.orderId,
          amountCents: a.amountCents,
        },
      });
    }

    // Refresh statuses for touched orders
    for (const a of allocations) {
      const order = await tx.order.findUnique({
        where: { id: a.orderId },
        include: { allocations: true },
      });
      if (!order) continue;

      const paid = order.allocations.reduce((s, x) => s + x.amountCents, 0);
      const status = paid >= order.totalCents ? "PAID" : paid > 0 ? "PARTIAL" : "OPEN";

      await tx.order.update({
        where: { id: order.id },
        data: { status },
      });
    }

    // Optional: calculate user outstanding after payment
    const allOrders = await tx.order.findMany({
      where: { userId, status: { not: "CANCELED" } },
      include: { allocations: true },
    });

    const totalCharged = allOrders.reduce((s, o) => s + o.totalCents, 0);
    const totalPaid = allOrders.reduce(
      (s, o) => s + o.allocations.reduce((x, a) => x + a.amountCents, 0),
      0
    );

    return {
      paymentId: payment.id,
      appliedCents: paymentAmount - remaining,
      unappliedCents: remaining,
      outstandingCents: Math.max(totalCharged - totalPaid, 0),
    };
  });
}

export async function submitPaymentFromForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const method = String(formData.get("method") ?? "CASH").trim().toUpperCase();
  const reference = String(formData.get("reference") ?? "").trim() || undefined;

  const amountCents = parseMoneyToCents(formData.get("amount"));
  const discountCents = parseMoneyToCents(formData.get("discount"));

  if (!userId) throw new Error("userId is required.");
  if (amountCents <= 0 && discountCents <= 0) {
    throw new Error("Amount or discount must be greater than 0.");
  }

  // Real payment
  if (amountCents > 0) {
    await settleUserBalance({
      userId,
      amountCents,
      method,
      reference,
    });
  }

  // Discount settlement as a separate audit entry
  if (discountCents > 0) {
    await settleUserBalance({
      userId,
      amountCents: discountCents,
      method: "DISCOUNT",
      reference: reference ? `Discount | ${reference}` : "Discount",
    });
  }

  revalidatePath("/accounting/open-orders");
  redirect("/accounting/open-orders");
}

function parseMoneyToCents(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

// Payment list grouped by payment method
export async function listPaymentsGroupedByMethod() {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ receivedAt: "desc" }],
  });

  const grouped = new Map<
    string,
    {
      method: string;
      totalCents: number;
      count: number;
      payments: Array<{
        id: string;
        amountCents: number;
        reference: string | null;
        receivedAt: Date;
        user: { id: string; name: string | null; email: string };
      }>;
    }
  >();

  for (const p of payments) {
    const key = p.method || "UNKNOWN";
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        method: key,
        totalCents: p.amountCents,
        count: 1,
        payments: [
          {
            id: p.id,
            amountCents: p.amountCents,
            reference: p.reference ?? null,
            receivedAt: p.receivedAt,
            user: p.user,
          },
        ],
      });
    } else {
      current.totalCents += p.amountCents;
      current.count += 1;
      current.payments.push({
        id: p.id,
        amountCents: p.amountCents,
        reference: p.reference ?? null,
        receivedAt: p.receivedAt,
        user: p.user,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.method.localeCompare(b.method)
  );
}
