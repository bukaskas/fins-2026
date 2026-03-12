"use server";
import { prisma } from "@/db/prisma";
import { Prisma, WalletLedgerReason, WalletType } from "@prisma/client";
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
  walletType: WalletType; // which wallet to debit
  units?: number; // default 1
  actorId?: string;
  beachVisitId?: string;
  lessonBookingId?: string;
  note?: string;
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

    // Create wallet ledger entries for bundle lines
    for (const line of order.lines) {
      const product = productMap.get(line.productId)!;
      if (product.type !== "BUNDLE_CREDIT") continue;

      if (!product.walletType || !product.walletUnit) {
        throw new Error(
          `Product ${product.sku} is BUNDLE_CREDIT but missing walletType/walletUnit.`
        );
      }

      const totalUnits = (line.creditUnitsEach ?? 0) * line.qty;
      if (totalUnits <= 0) continue;

      // Find or create wallet
      const wallet = await tx.userWallet.upsert({
        where: { userId_type: { userId, type: product.walletType } },
        update: {},
        create: {
          userId,
          type: product.walletType,
          unit: product.walletUnit,
          balance: new Prisma.Decimal(0),
        },
      });

      if (wallet.unit !== product.walletUnit) {
        throw new Error(
          `Wallet unit mismatch for ${product.walletType}: expected ${product.walletUnit}, found ${wallet.unit}.`
        );
      }

      // Increment balance and record ledger entry
      const updatedWallet = await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: totalUnits } },
        select: { id: true, balance: true },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          delta: new Prisma.Decimal(totalUnits),
          balanceAfter: updatedWallet.balance,
          reason: WalletLedgerReason.PURCHASE,
          orderId: order.id,
          orderLineId: line.id,
          note: `Purchased ${totalUnits} ${product.walletUnit}(s) — order ${order.id}`,
          idempotencyKey: `purchase:${line.id}`,
        },
      });
    }

    return order;
  });
}


export async function consumeBundleUnit(input: ConsumeBundleUnitInput) {
  const {
    userId,
    walletType,
    actorId,
    beachVisitId,
    lessonBookingId,
    note,
  } = input;
  const units = toInt(input.units ?? 1);
  if (units <= 0) throw new Error("Units must be > 0.");

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({
      where: { userId_type: { userId, type: walletType } },
      select: { id: true, balance: true, unit: true },
    });

    if (!wallet || wallet.balance.lt(units)) {
      throw new Error("Insufficient wallet balance.");
    }

    // Atomic decrement — will throw if balance drops below 0 due to a race
    const updatedWallet = await tx.userWallet.update({
      where: { id: wallet.id, balance: { gte: units } },
      data: { balance: { decrement: units } },
      select: { id: true, balance: true },
    });

    const idempotencyKey = beachVisitId
      ? `consume:${walletType}:beach:${beachVisitId}`
      : lessonBookingId
        ? `consume:${walletType}:lesson:${lessonBookingId}`
        : null;

    const entry = await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        userId,
        actorId: actorId ?? null,
        delta: new Prisma.Decimal(-units),
        balanceAfter: updatedWallet.balance,
        reason: WalletLedgerReason.CONSUMPTION,
        beachVisitId: beachVisitId ?? null,
        lessonBookingId: lessonBookingId ?? null,
        note: note ?? `Consumed ${units} ${wallet.unit}(s) from ${walletType}`,
        idempotencyKey,
      },
    });

    return {
      ledgerEntryId: entry.id,
      balanceAfter: updatedWallet.balance,
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
