"use server";
import { prisma } from "@/db/prisma";
import { OrderStatus, PaymentMethod, Prisma, WalletLedgerReason, WalletType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, STAFF_ROLES } from "@/lib/auth-guard";

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
  method: PaymentMethod;
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

// Settlement transactions run Serializable so two concurrent payments for the
// same user can't both allocate against the same outstanding amount. Postgres
// aborts one of them (Prisma P2034); retry it a couple of times.
async function withSerializableRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "P2034" && attempt < attempts) continue;
      throw err;
    }
  }
}

export async function createOrderForUser(input: CreateOrderForUserInput) {
  await requireRole(STAFF_ROLES);
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
        status: OrderStatus.OPEN,
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

      const totalUnits = new Prisma.Decimal(line.creditUnitsEach ?? 0).mul(line.qty);
      if (totalUnits.lte(0)) continue;

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
          delta: totalUnits,
          balanceAfter: updatedWallet.balance,
          reason: WalletLedgerReason.PURCHASE,
          orderId: order.id,
          orderLineId: line.id,
          note: `Purchased ${totalUnits.toString()} ${product.walletUnit}(s) — order ${order.id}`,
          idempotencyKey: `purchase:${line.id}`,
        },
      });
    }

    return order;
  });
}


export async function consumeBundleUnit(input: ConsumeBundleUnitInput) {
  await requireRole(STAFF_ROLES);
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
  await requireRole(STAFF_ROLES);
  const { userId, amountCents, method, reference } = input;
  const paymentAmount = toInt(amountCents);

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be > 0.");
  }

  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
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
      where: { userId, status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] } },
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

    // Reject overpayment: an unallocated surplus would vanish from the books
    // (no credit-balance concept exists). Rolls the whole payment back.
    if (remaining > 0) {
      throw new Error(
        `Payment exceeds the outstanding balance by ${(remaining / 100).toFixed(2)} EGP. ` +
          "Reduce the amount, or create the order being paid for first.",
      );
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
      const status = paid >= order.totalCents ? OrderStatus.PAID : paid > 0 ? OrderStatus.PARTIAL : OrderStatus.OPEN;

      await tx.order.update({
        where: { id: order.id },
        data: { status },
      });
    }

    // Optional: calculate user outstanding after payment
    const allOrders = await tx.order.findMany({
      where: { userId, status: { not: OrderStatus.CANCELED } },
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
  }, {
    timeout: 30000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  }));
}

type UpdatePaymentPatch = {
  receivedAt: Date;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
};

export async function updatePayment(
  paymentId: string,
  patch: UpdatePaymentPatch,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(STAFF_ROLES);
  if (!paymentId) return { success: false, error: "Missing payment id." };

  const newAmount = toInt(patch.amountCents);
  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    return { success: false, error: "Amount must be greater than 0." };
  }
  if (!(patch.receivedAt instanceof Date) || Number.isNaN(patch.receivedAt.getTime())) {
    return { success: false, error: "Invalid date." };
  }

  try {
    const userId = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          allocations: { select: { orderId: true, amountCents: true } },
          commissions: { select: { id: true }, take: 1 },
          expenses: { select: { id: true }, take: 1 },
        },
      });
      if (!payment) throw new Error("Payment not found.");
      if (payment.commissions.length > 0 || payment.expenses.length > 0) {
        throw new Error("This payment is tied to a commission or expense settlement and can't be edited here.");
      }

      const amountChanged = newAmount !== payment.amountCents;

      if (amountChanged) {
        const affectedOrderIds = new Set(payment.allocations.map((a) => a.orderId));

        await tx.paymentAllocation.deleteMany({ where: { paymentId } });

        // Gather candidate orders: user's open/partial orders + any order this
        // payment previously touched (since shrinking may free a previously-PAID order).
        const candidateOrders = await tx.order.findMany({
          where: {
            userId: payment.userId,
            OR: [
              { status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] } },
              { id: { in: Array.from(affectedOrderIds) } },
            ],
            NOT: { status: OrderStatus.CANCELED },
          },
          orderBy: { createdAt: "asc" },
          include: { allocations: { select: { amountCents: true } } },
        });

        let remaining = newAmount;
        const newAllocations: Array<{ orderId: string; amountCents: number }> = [];
        for (const order of candidateOrders) {
          if (remaining <= 0) break;
          const alreadyPaid = order.allocations.reduce((s, a) => s + a.amountCents, 0);
          const outstanding = order.totalCents - alreadyPaid;
          if (outstanding <= 0) continue;
          const alloc = Math.min(outstanding, remaining);
          newAllocations.push({ orderId: order.id, amountCents: alloc });
          remaining -= alloc;
        }

        if (remaining > 0) {
          throw new Error(
            `New amount exceeds the user's outstanding balance by ${(remaining / 100).toFixed(2)} EGP.`,
          );
        }

        for (const a of newAllocations) {
          await tx.paymentAllocation.create({
            data: { paymentId, orderId: a.orderId, amountCents: a.amountCents },
          });
        }

        const ordersToRecompute = new Set<string>(affectedOrderIds);
        for (const a of newAllocations) ordersToRecompute.add(a.orderId);

        for (const orderId of ordersToRecompute) {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { allocations: { select: { amountCents: true } } },
          });
          if (!order || order.status === OrderStatus.CANCELED) continue;
          const paid = order.allocations.reduce((s, x) => s + x.amountCents, 0);
          const status =
            paid >= order.totalCents
              ? OrderStatus.PAID
              : paid > 0
                ? OrderStatus.PARTIAL
                : OrderStatus.OPEN;
          if (status !== order.status) {
            await tx.order.update({ where: { id: order.id }, data: { status } });
          }
        }
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          receivedAt: patch.receivedAt,
          amountCents: newAmount,
          method: patch.method,
          reference: patch.reference,
        },
      });

      return payment.userId;
    }, {
      timeout: 30000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }));

    revalidatePath("/accounting/payments");
    revalidatePath("/accounting/open-orders");
    revalidatePath(`/users/${userId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update payment.",
    };
  }
}

export async function submitPaymentFromForm(formData: FormData) {
  await requireRole(STAFF_ROLES);
  const userId = String(formData.get("userId") ?? "").trim();
  const method = String(formData.get("method") ?? "CASH").trim().toUpperCase() as PaymentMethod;
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
      method: PaymentMethod.DISCOUNT,
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
  await requireRole(STAFF_ROLES);
  // Only incoming guest payments: exclude rows that were created as the
  // settlement side of an instructor commission or an expense payout.
  const payments = await prisma.payment.findMany({
    where: {
      commissions: { none: {} },
      expenses: { none: {} },
    },
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
