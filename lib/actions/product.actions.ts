"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { ProductType, WalletType, WalletUnit } from "@prisma/client";

export async function getAllProducts(filters?: {
  type?: ProductType;
  isActive?: boolean;
}) {
  return prisma.product.findMany({
    where: {
      ...(filters?.type !== undefined && { type: filters.type }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createProduct(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProductType;
  const priceEgp = Number(formData.get("price") ?? 0);

  if (!sku || !name || !type) {
    return { success: false, error: "SKU, name, and type are required." };
  }
  if (isNaN(priceEgp) || priceEgp < 0) {
    return { success: false, error: "Price must be a non-negative number." };
  }

  const priceCents = Math.round(priceEgp * 100);

  let creditUnits: number | null = null;
  let creditValidDays: number | null = null;
  let walletType: WalletType | null = null;
  let walletUnit: WalletUnit | null = null;

  if (type === ProductType.BUNDLE_CREDIT) {
    creditUnits = Number(formData.get("creditUnits") ?? 0);
    const validDaysRaw = formData.get("creditValidDays");
    creditValidDays = validDaysRaw ? Number(validDaysRaw) : null;
    walletType = String(formData.get("walletType") ?? "") as WalletType;
    walletUnit = String(formData.get("walletUnit") ?? "") as WalletUnit;

    if (!creditUnits || creditUnits < 1) {
      return { success: false, error: "Credit units must be at least 1 for bundle products." };
    }
    if (!walletType || !Object.values(WalletType).includes(walletType)) {
      return { success: false, error: "Wallet type is required for bundle products." };
    }
    if (!walletUnit || !Object.values(WalletUnit).includes(walletUnit)) {
      return { success: false, error: "Wallet unit is required for bundle products." };
    }
  }

  try {
    await prisma.product.create({
      data: {
        sku,
        name,
        type,
        priceCents,
        creditUnits,
        creditValidDays,
        walletType,
        walletUnit,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, error: `SKU "${sku}" is already in use.` };
    }
    return { success: false, error: "Failed to create product." };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProductType;
  const priceEgp = Number(formData.get("price") ?? 0);

  if (!name || !type) {
    return { success: false, error: "Name and type are required." };
  }
  if (isNaN(priceEgp) || priceEgp < 0) {
    return { success: false, error: "Price must be a non-negative number." };
  }

  const priceCents = Math.round(priceEgp * 100);

  let creditUnits: number | null = null;
  let creditValidDays: number | null = null;
  let walletType: WalletType | null = null;
  let walletUnit: WalletUnit | null = null;

  if (type === ProductType.BUNDLE_CREDIT) {
    creditUnits = Number(formData.get("creditUnits") ?? 0);
    const validDaysRaw = formData.get("creditValidDays");
    creditValidDays = validDaysRaw ? Number(validDaysRaw) : null;
    walletType = String(formData.get("walletType") ?? "") as WalletType;
    walletUnit = String(formData.get("walletUnit") ?? "") as WalletUnit;

    if (!creditUnits || creditUnits < 1) {
      return { success: false, error: "Credit units must be at least 1 for bundle products." };
    }
    if (!walletType || !Object.values(WalletType).includes(walletType)) {
      return { success: false, error: "Wallet type is required for bundle products." };
    }
    if (!walletUnit || !Object.values(WalletUnit).includes(walletUnit)) {
      return { success: false, error: "Wallet unit is required for bundle products." };
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        type,
        priceCents,
        creditUnits,
        creditValidDays,
        walletType,
        walletUnit,
      },
    });
  } catch {
    return { success: false, error: "Failed to update product." };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function toggleProductActive(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/products");
}
