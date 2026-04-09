"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { InventoryCategory, InventoryMovementType, ItemCondition } from "@prisma/client";

export async function getAllInventoryItems() {
  return prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getAvailableInventoryItems() {
  return prisma.inventoryItem.findMany({
    where: { isActive: true, availableQty: { gt: 0 } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getInventoryItemById(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { select: { name: true, email: true } },
          rentalLine: {
            select: {
              rental: {
                select: { id: true, guest: { select: { name: true, email: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export async function createInventoryItem(formData: FormData) {
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as InventoryCategory;
  const size = String(formData.get("size") ?? "").trim() || null;
  const totalQty = Number(formData.get("totalQty") ?? 0);
  const condition = (String(formData.get("condition") ?? "GOOD") as ItemCondition);

  if (!sku || !name) throw new Error("SKU and name are required.");

  await prisma.inventoryItem.create({
    data: {
      sku,
      name,
      category,
      size,
      totalQty,
      availableQty: totalQty,
      condition,
    },
  });

  revalidatePath("/inventory");
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as InventoryCategory;
  const size = String(formData.get("size") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "") as ItemCondition;
  const isActive = formData.get("isActive") === "true";

  await prisma.inventoryItem.update({
    where: { id },
    data: { name, category, size, condition, isActive },
  });

  revalidatePath(`/inventory/${id}`);
  revalidatePath("/inventory");
}

export async function adjustInventoryQty(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "").trim();
  const adjustment = Number(formData.get("adjustment") ?? 0);
  const type = String(formData.get("type") ?? "ADJUSTMENT") as InventoryMovementType;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const actorId = String(formData.get("actorId") ?? "").trim() || null;

  if (!itemId || adjustment === 0) throw new Error("Item and non-zero adjustment required.");

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Item not found.");

    await tx.inventoryItem.update({
      where: { id: itemId },
      data: {
        totalQty: { increment: adjustment },
        availableQty: { increment: adjustment },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryItemId: itemId,
        type,
        qty: adjustment,
        reason,
        actorId,
      },
    });
  });

  revalidatePath(`/inventory/${itemId}`);
  revalidatePath("/inventory");
}
