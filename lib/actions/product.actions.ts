"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { LessonType, ProductCategory, ProductType, WalletType, WalletUnit } from "@prisma/client";
import { requireRole, STAFF_ROLES } from "@/lib/auth-guard";

export async function getAllProducts(filters?: {
  type?: ProductType;
  category?: ProductCategory;
  isActive?: boolean;
}) {
  await requireRole(STAFF_ROLES);
  return prisma.product.findMany({
    where: {
      ...(filters?.type !== undefined && { type: filters.type }),
      ...(filters?.category !== undefined && { category: filters.category }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

function parseCategory(formData: FormData): ProductCategory | null | "invalid" {
  const raw = String(formData.get("category") ?? "").trim();
  if (!raw) return null;
  if (!Object.values(ProductCategory).includes(raw as ProductCategory)) {
    return "invalid";
  }
  return raw as ProductCategory;
}

export async function createProduct(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requireRole(STAFF_ROLES);
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

  const category = parseCategory(formData);
  if (category === "invalid") {
    return { success: false, error: "Invalid category." };
  }

  const priceCents = Math.round(priceEgp * 100);

  const lessonFields = parseLessonFields(formData, type, category);
  if ("error" in lessonFields) return { success: false, error: lessonFields.error };
  const { creditUnits, creditValidDays, walletType, walletUnit, lessonType, referenceDurationMinutes } = lessonFields;

  try {
    await prisma.product.create({
      data: {
        sku,
        name,
        type,
        category,
        priceCents,
        creditUnits,
        creditValidDays,
        walletType,
        walletUnit,
        lessonType,
        referenceDurationMinutes,
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
  await requireRole(STAFF_ROLES);
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProductType;
  const priceEgp = Number(formData.get("price") ?? 0);

  if (!name || !type) {
    return { success: false, error: "Name and type are required." };
  }
  if (isNaN(priceEgp) || priceEgp < 0) {
    return { success: false, error: "Price must be a non-negative number." };
  }

  const category = parseCategory(formData);
  if (category === "invalid") {
    return { success: false, error: "Invalid category." };
  }

  const priceCents = Math.round(priceEgp * 100);

  const lessonFields = parseLessonFields(formData, type, category);
  if ("error" in lessonFields) return { success: false, error: lessonFields.error };
  const { creditUnits, creditValidDays, walletType, walletUnit, lessonType, referenceDurationMinutes } = lessonFields;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        type,
        category,
        priceCents,
        creditUnits,
        creditValidDays,
        walletType,
        walletUnit,
        lessonType,
        referenceDurationMinutes,
      },
    });
  } catch {
    return { success: false, error: "Failed to update product." };
  }

  revalidatePath("/products");
  return { success: true };
}

type LessonFields = {
  creditUnits: number | null;
  creditValidDays: number | null;
  walletType: WalletType | null;
  walletUnit: WalletUnit | null;
  lessonType: LessonType | null;
  referenceDurationMinutes: number | null;
};

function parseLessonFields(
  formData: FormData,
  type: ProductType,
  category: ProductCategory | null,
): LessonFields | { error: string } {
  let creditUnits: number | null = null;
  let creditValidDays: number | null = null;
  let walletType: WalletType | null = null;
  let walletUnit: WalletUnit | null = null;
  let lessonType: LessonType | null = null;
  let referenceDurationMinutes: number | null = null;

  if (type === ProductType.BUNDLE_CREDIT) {
    creditUnits = Number(formData.get("creditUnits") ?? 0);
    const validDaysRaw = formData.get("creditValidDays");
    creditValidDays = validDaysRaw ? Number(validDaysRaw) : null;
    walletType = String(formData.get("walletType") ?? "") as WalletType;
    walletUnit = String(formData.get("walletUnit") ?? "") as WalletUnit;

    if (!creditUnits || creditUnits < 1) {
      return { error: "Credit units must be at least 1 for bundle products." };
    }
    if (!walletType || !Object.values(WalletType).includes(walletType)) {
      return { error: "Wallet type is required for bundle products." };
    }
    if (!walletUnit || !Object.values(WalletUnit).includes(walletUnit)) {
      return { error: "Wallet unit is required for bundle products." };
    }
  }

  const lessonTypeRaw = String(formData.get("lessonType") ?? "").trim();
  if (lessonTypeRaw) {
    if (!Object.values(LessonType).includes(lessonTypeRaw as LessonType)) {
      return { error: "Invalid lesson type." };
    }
    lessonType = lessonTypeRaw as LessonType;
  }

  const refDurationRaw = formData.get("referenceDurationMinutes");
  if (refDurationRaw && String(refDurationRaw).trim() !== "") {
    const parsed = Number(refDurationRaw);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return { error: "Reference duration must be a positive number of minutes." };
    }
    referenceDurationMinutes = Math.round(parsed);
  }

  if (category === ProductCategory.LESSONS) {
    if (!lessonType) {
      return { error: "Lesson type is required for LESSONS-category products." };
    }
    if (!referenceDurationMinutes) {
      return { error: "Reference duration (minutes) is required for LESSONS-category products." };
    }
  }

  return { creditUnits, creditValidDays, walletType, walletUnit, lessonType, referenceDurationMinutes };
}

export async function toggleProductActive(id: string): Promise<void> {
  await requireRole(STAFF_ROLES);
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/products");
}
