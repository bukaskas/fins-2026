"use server";

import { prisma } from "@/db/prisma";

export async function listUnsettledOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["OPEN", "PARTIAL"] },
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
