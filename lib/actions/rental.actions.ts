"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { createRentalSchema } from "@/lib/validators";
import { currentUserId, requireCapability } from "@/lib/auth-guard";

const OVERDUE_AFTER_HOURS = 4;

export async function createRental(formData: FormData) {
  await requireCapability("rentals:manage");
  // Audit attribution comes from the session, never from the form.
  const actorId = await currentUserId();
  const productLinesJson = String(formData.get("productLinesJson") ?? "[]");

  let productLinesRaw: unknown;
  try {
    productLinesRaw = JSON.parse(productLinesJson);
  } catch {
    throw new Error("Invalid product lines data.");
  }

  const parsed = createRentalSchema.safeParse({
    guestId: String(formData.get("guestId") ?? "").trim(),
    notes: String(formData.get("notes") ?? ""),
    productLines: productLinesRaw,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid rental data.");
  }
  const { guestId, notes, productLines } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: guestId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found.");

    const productIds = Array.from(new Set(productLines.map((p) => p.productId)));
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        priceCents: true,
        category: true,
        isActive: true,
      },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const pl of productLines) {
      const p = productById.get(pl.productId);
      if (!p || !p.isActive) {
        throw new Error("Rental product not found or inactive.");
      }
      if (p.category !== "RENTAL") {
        throw new Error(`"${p.name}" is not a rental product.`);
      }
    }

    const itemIds = Array.from(
      new Set(productLines.flatMap((p) => p.equipment.map((e) => e.inventoryItemId))),
    );
    const items = await tx.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, availableQty: true, isActive: true },
    });
    const itemById = new Map(items.map((i) => [i.id, i]));

    const requestedById = new Map<string, number>();
    for (const pl of productLines) {
      for (const eq of pl.equipment) {
        requestedById.set(
          eq.inventoryItemId,
          (requestedById.get(eq.inventoryItemId) ?? 0) + eq.qty,
        );
      }
    }
    for (const [itemId, requested] of requestedById) {
      const item = itemById.get(itemId);
      if (!item || !item.isActive) throw new Error("Equipment item not found or inactive.");
      if (item.availableQty < requested) {
        throw new Error(
          `Not enough stock for "${item.name}" (available: ${item.availableQty}, requested: ${requested}).`,
        );
      }
    }

    const totalCents = productLines.reduce((sum, pl) => {
      const p = productById.get(pl.productId)!;
      return sum + p.priceCents * pl.qty;
    }, 0);

    const order = await tx.order.create({
      data: {
        userId: guestId,
        status: "OPEN",
        totalCents,
      },
    });

    const rental = await tx.rental.create({
      data: {
        guestId,
        orderId: order.id,
        startsAt: new Date(),
        status: "OPEN",
        totalCents,
        notes,
      },
    });

    for (const pl of productLines) {
      const product = productById.get(pl.productId)!;
      const lineTotalCents = product.priceCents * pl.qty;
      const orderLine = await tx.orderLine.create({
        data: {
          orderId: order.id,
          productId: product.id,
          qty: pl.qty,
          unitPriceCents: product.priceCents,
          lineTotalCents,
        },
      });

      for (const eq of pl.equipment) {
        const rentalLine = await tx.rentalLine.create({
          data: {
            rentalId: rental.id,
            orderLineId: orderLine.id,
            inventoryItemId: eq.inventoryItemId,
            qty: eq.qty,
            unitPriceCents: 0,
            lineTotalCents: 0,
          },
        });

        await tx.inventoryItem.update({
          where: { id: eq.inventoryItemId },
          data: { availableQty: { decrement: eq.qty } },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: eq.inventoryItemId,
            rentalLineId: rentalLine.id,
            actorId,
            type: "OUT",
            qty: eq.qty,
            reason: "Rental checkout",
          },
        });
      }
    }
  });

  revalidatePath("/rentals");
  redirect("/rentals");
}

export async function returnRental(rentalId: string) {
  await requireCapability("rentals:manage");
  await prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { lines: true },
    });
    if (!rental) throw new Error("Rental not found.");
    if (rental.status !== "OPEN" && rental.status !== "LATE") {
      throw new Error("Only active rentals can be returned.");
    }

    const now = new Date();
    const openLines = rental.lines.filter((l) => l.returnedAt === null);

    for (const line of openLines) {
      await tx.rentalLine.update({
        where: { id: line.id },
        data: { returnedAt: now },
      });

      await tx.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: { availableQty: { increment: line.qty } },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          rentalLineId: line.id,
          type: "IN",
          qty: line.qty,
          reason: "Rental returned",
        },
      });
    }

    await tx.rental.update({
      where: { id: rentalId },
      data: { status: "RETURNED", returnedAt: now },
    });
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${rentalId}`);
}

export async function returnRentalLine(rentalLineId: string) {
  await requireCapability("rentals:manage");
  await prisma.$transaction(async (tx) => {
    const line = await tx.rentalLine.findUnique({
      where: { id: rentalLineId },
      include: { rental: true },
    });
    if (!line) throw new Error("Rental line not found.");
    if (line.returnedAt) throw new Error("Item already returned.");
    if (line.rental.status !== "OPEN" && line.rental.status !== "LATE") {
      throw new Error("Rental is not active.");
    }

    const now = new Date();

    await tx.rentalLine.update({
      where: { id: rentalLineId },
      data: { returnedAt: now },
    });

    await tx.inventoryItem.update({
      where: { id: line.inventoryItemId },
      data: { availableQty: { increment: line.qty } },
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryItemId: line.inventoryItemId,
        rentalLineId: line.id,
        type: "IN",
        qty: line.qty,
        reason: "Rental line returned",
      },
    });

    const stillOpen = await tx.rentalLine.count({
      where: { rentalId: line.rentalId, returnedAt: null },
    });

    if (stillOpen === 0) {
      await tx.rental.update({
        where: { id: line.rentalId },
        data: { status: "RETURNED", returnedAt: now },
      });
    }
  });

  const line = await prisma.rentalLine.findUnique({
    where: { id: rentalLineId },
    select: { rentalId: true },
  });
  revalidatePath("/rentals");
  if (line) revalidatePath(`/rentals/${line.rentalId}`);
}

export async function cancelRental(rentalId: string) {
  await requireCapability("rentals:manage");
  await prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { lines: true },
    });
    if (!rental) throw new Error("Rental not found.");
    if (rental.status !== "OPEN") {
      throw new Error("Only open rentals can be canceled.");
    }

    await tx.rental.update({
      where: { id: rentalId },
      data: { status: "CANCELED" },
    });

    const openLines = rental.lines.filter((l) => l.returnedAt === null);
    for (const line of openLines) {
      await tx.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: { availableQty: { increment: line.qty } },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          rentalLineId: line.id,
          type: "IN",
          qty: line.qty,
          reason: "Rental canceled",
        },
      });
    }
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${rentalId}`);
}

export async function getAllRentals() {
  await requireCapability("rentals:manage");
  return prisma.rental.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      guest: { select: { id: true, name: true, email: true, phone: true } },
      order: {
        include: {
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      },
      lines: {
        include: {
          inventoryItem: { select: { name: true, category: true, size: true } },
        },
      },
    },
  });
}

export async function getRentalById(id: string) {
  await requireCapability("rentals:manage");
  return prisma.rental.findUnique({
    where: { id },
    include: {
      guest: { select: { id: true, name: true, email: true, phone: true } },
      order: {
        include: {
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true, priceCents: true } },
            },
          },
        },
      },
      lines: {
        include: {
          inventoryItem: { select: { id: true, name: true, category: true, size: true } },
          movements: {
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { name: true, email: true } } },
          },
          orderLine: { select: { id: true } },
        },
      },
    },
  });
}

export async function getRentalProducts() {
  await requireCapability("rentals:manage");
  return prisma.product.findMany({
    where: { category: "RENTAL", isActive: true },
    select: { id: true, name: true, sku: true, priceCents: true },
    orderBy: { name: "asc" },
  });
}

export async function markOverdueRentals() {
  await requireCapability("rentals:manage");
  const cutoff = new Date(Date.now() - OVERDUE_AFTER_HOURS * 60 * 60 * 1000);
  await prisma.rental.updateMany({
    where: { status: "OPEN", startsAt: { lt: cutoff } },
    data: { status: "LATE" },
  });
}

export async function getRentalFormUsers() {
  await requireCapability("rentals:manage");
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: "asc" },
  });
}
