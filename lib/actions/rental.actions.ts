"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";

const RENTAL_SERVICE_SKU = "RENTAL_SERVICE";

type RentalLineInput = {
  inventoryItemId: string;
  qty: number;
  unitPriceCents: number;
};

export async function createRental(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "").trim();
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const dueAt = new Date(String(formData.get("dueAt") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const actorId = String(formData.get("actorId") ?? "").trim() || null;
  const linesJson = String(formData.get("linesJson") ?? "[]");

  let lines: RentalLineInput[];
  try {
    lines = JSON.parse(linesJson);
  } catch {
    throw new Error("Invalid lines data.");
  }

  if (!guestId) throw new Error("Guest is required.");
  if (lines.length === 0) throw new Error("At least one item is required.");
  if (isNaN(startsAt.getTime()) || isNaN(dueAt.getTime())) throw new Error("Invalid dates.");
  if (dueAt <= startsAt) throw new Error("Due date must be after start date.");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: guestId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found.");

    // Validate availability and calculate total
    let totalCents = 0;
    for (const line of lines) {
      const item = await tx.inventoryItem.findUnique({
        where: { id: line.inventoryItemId },
        select: { id: true, availableQty: true, isActive: true, name: true },
      });
      if (!item || !item.isActive) throw new Error(`Item not found or inactive.`);
      if (item.availableQty < line.qty) {
        throw new Error(`Not enough stock for "${item.name}" (available: ${item.availableQty}).`);
      }
      totalCents += line.qty * line.unitPriceCents;
    }

    // Create rental
    const rental = await tx.rental.create({
      data: {
        guestId,
        startsAt,
        dueAt,
        status: "OPEN",
        totalCents,
        notes,
      },
    });

    // Create lines, decrement inventory, log movements
    for (const line of lines) {
      const rentalLine = await tx.rentalLine.create({
        data: {
          rentalId: rental.id,
          inventoryItemId: line.inventoryItemId,
          qty: line.qty,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.qty * line.unitPriceCents,
        },
      });

      await tx.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: { availableQty: { decrement: line.qty } },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          rentalLineId: rentalLine.id,
          actorId,
          type: "OUT",
          qty: line.qty,
          reason: "Rental checkout",
        },
      });
    }

    // Create order for payment tracking
    let product = await tx.product.findUnique({
      where: { sku: RENTAL_SERVICE_SKU },
      select: { id: true },
    });

    if (!product) {
      product = await tx.product.create({
        data: {
          name: "Equipment Rental",
          sku: RENTAL_SERVICE_SKU,
          type: "SERVICE",
          priceCents: 0,
          currency: "EGP",
          isActive: true,
        },
        select: { id: true },
      });
    }

    await tx.order.create({
      data: {
        userId: guestId,
        status: "OPEN",
        totalCents,
        lines: {
          create: [
            {
              productId: product.id,
              qty: 1,
              unitPriceCents: totalCents,
              lineTotalCents: totalCents,
            },
          ],
        },
      },
    });
  });

  revalidatePath("/rentals");
  redirect("/rentals");
}

export async function returnRental(rentalId: string) {
  await prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { lines: true },
    });
    if (!rental) throw new Error("Rental not found.");
    if (rental.status !== "OPEN" && rental.status !== "LATE") {
      throw new Error("Only active rentals can be returned.");
    }

    await tx.rental.update({
      where: { id: rentalId },
      data: { status: "RETURNED", returnedAt: new Date() },
    });

    for (const line of rental.lines) {
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
  });

  revalidatePath("/rentals");
}

export async function cancelRental(rentalId: string) {
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

    for (const line of rental.lines) {
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
}

export async function getAllRentals() {
  return prisma.rental.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      guest: { select: { id: true, name: true, email: true, phone: true } },
      lines: {
        include: {
          inventoryItem: { select: { name: true, category: true, size: true } },
        },
      },
    },
  });
}

export async function getRentalById(id: string) {
  return prisma.rental.findUnique({
    where: { id },
    include: {
      guest: { select: { id: true, name: true, email: true, phone: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, name: true, category: true, size: true } },
          movements: {
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });
}

export async function markOverdueRentals() {
  const now = new Date();
  await prisma.rental.updateMany({
    where: { status: "OPEN", dueAt: { lt: now } },
    data: { status: "LATE" },
  });
}

export async function getRentalFormUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: "asc" },
  });
}
