"use server";

import { OrderStatus, ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { createOrderForUser } from "@/lib/actions/payment.actions";

export type OrderLineInput = { productId: string; qty: number };

export async function createOrderFromForm(input: {
  userId: string;
  items: OrderLineInput[];
}) {
  if (!input.userId) {
    return { success: false as const, error: "Missing user." };
  }
  const cleanedItems = input.items
    .filter((i) => i.productId && Number.isFinite(i.qty) && i.qty > 0)
    .map((i) => ({ productId: i.productId, qty: i.qty }));
  if (cleanedItems.length === 0) {
    return { success: false as const, error: "Add at least one product." };
  }

  try {
    const order = await createOrderForUser({ userId: input.userId, items: cleanedItems });
    revalidatePath(`/users/${input.userId}`);
    return { success: true as const, orderId: order.id };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to create order.",
    };
  }
}

export async function updateOrderLines(
  orderId: string,
  items: OrderLineInput[],
) {
  if (!orderId) return { success: false as const, error: "Missing order." };

  const cleanedItems = items
    .filter((i) => i.productId && Number.isFinite(i.qty) && i.qty > 0)
    .map((i) => ({ productId: i.productId, qty: i.qty }));
  if (cleanedItems.length === 0) {
    return { success: false as const, error: "Order must contain at least one line." };
  }

  try {
    const updatedUserId = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          lines: { include: { product: { select: { type: true } } } },
        },
      });
      if (!order) throw new Error("Order not found.");
      if (order.status !== OrderStatus.OPEN) {
        throw new Error(`Cannot edit ${order.status.toLowerCase()} orders.`);
      }
      if (order.lines.some((l) => l.product.type === ProductType.BUNDLE_CREDIT)) {
        throw new Error(
          "Bundle-credit orders can't be edited — cancel and re-issue instead.",
        );
      }

      const productIds = [...new Set(cleanedItems.map((i) => i.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, isActive: true, type: true, priceCents: true, sku: true },
      });
      if (products.length !== productIds.length) {
        throw new Error("One or more products no longer exist.");
      }
      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of cleanedItems) {
        const product = productMap.get(item.productId)!;
        if (!product.isActive) {
          throw new Error(`Product "${product.sku}" is inactive.`);
        }
        if (product.type === ProductType.BUNDLE_CREDIT) {
          throw new Error(
            `Product "${product.sku}" is a bundle credit — sell it via a new order, not by editing.`,
          );
        }
      }

      await tx.orderLine.deleteMany({ where: { orderId } });

      const lineRows = cleanedItems.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPriceCents = product.priceCents;
        return {
          orderId,
          productId: product.id,
          qty: item.qty,
          unitPriceCents,
          lineTotalCents: unitPriceCents * item.qty,
        };
      });
      await tx.orderLine.createMany({ data: lineRows });

      const totalCents = lineRows.reduce((s, l) => s + l.lineTotalCents, 0);
      await tx.order.update({
        where: { id: orderId },
        data: { totalCents },
      });

      return order.userId;
    });

    revalidatePath(`/users/${updatedUserId}`);
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to update order.",
    };
  }
}

export async function cancelOrder(orderId: string) {
  if (!orderId) return { success: false as const, error: "Missing order." };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        allocations: { select: { id: true } },
      },
    });
    if (!order) return { success: false as const, error: "Order not found." };
    if (order.status !== OrderStatus.OPEN) {
      return {
        success: false as const,
        error: `Cannot cancel ${order.status.toLowerCase()} orders.`,
      };
    }
    if (order.allocations.length > 0) {
      return {
        success: false as const,
        error: "Cannot cancel an order with payment allocations.",
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED },
    });
    revalidatePath(`/users/${order.userId}`);
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to cancel order.",
    };
  }
}

export async function listUnsettledOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      allocations: {
        select: { amountCents: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<
    string,
    {
      user: { id: string; name: string | null; email: string; phone: string | null };
      totalOutstandingCents: number;
      orders: Array<{
        id: string;
        createdAt: Date;
        status: string;
        totalCents: number;
        paidCents: number;
        dueCents: number;
      }>;
    }
  >();

  for (const o of orders) {
    const paidCents = o.allocations.reduce((s, a) => s + a.amountCents, 0);
    const dueCents = Math.max(o.totalCents - paidCents, 0);
    if (dueCents <= 0) continue;

    const existing = grouped.get(o.user.id);
    if (!existing) {
      grouped.set(o.user.id, {
        user: o.user,
        totalOutstandingCents: dueCents,
        orders: [
          {
            id: o.id,
            createdAt: o.createdAt,
            status: o.status,
            totalCents: o.totalCents,
            paidCents,
            dueCents,
          },
        ],
      });
    } else {
      existing.totalOutstandingCents += dueCents;
      existing.orders.push({
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        totalCents: o.totalCents,
        paidCents,
        dueCents,
      });
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.totalOutstandingCents - a.totalOutstandingCents
  );
}
