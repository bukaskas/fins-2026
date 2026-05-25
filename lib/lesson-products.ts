import { LessonType, Prisma } from "@prisma/client";

export const LESSON_TYPE_SKU: Record<LessonType, string> = {
  PRIVATE: "LESSON_PRIVATE",
  GROUP: "LESSON_GROUP",
  EXTRA_PRIVATE: "LESSON_EXTRA_PRIVATE",
  EXTRA_GROUP: "LESSON_EXTRA_GROUP",
  FOIL: "LESSON_FOIL",
  KIDS: "LESSON_KIDS",
};

// `Product.priceCents` for a LESSON_* SKU is the price for this canonical
// duration. Sessions of other durations get prorated by hourly rate.
export const LESSON_CANONICAL_MINUTES: Record<LessonType, number> = {
  PRIVATE: 120,
  GROUP: 150,
  EXTRA_PRIVATE: 60,
  EXTRA_GROUP: 60,
  FOIL: 90,
  KIDS: 90,
};

type TxClient = Prisma.TransactionClient;

export async function getDefaultProductForLessonType(
  tx: TxClient,
  lessonType: LessonType,
) {
  const sku = LESSON_TYPE_SKU[lessonType];
  const product = await tx.product.findUnique({ where: { sku } });
  if (!product || !product.isActive) {
    throw new Error(
      `No active product configured for lesson type ${lessonType} (expected SKU "${sku}"). Create it in /products before adding a guest.`,
    );
  }
  return product;
}

export function proratePriceCents(
  productPriceCents: number,
  referenceMinutes: number,
  durationMinutes: number,
): number {
  if (durationMinutes <= 0 || referenceMinutes <= 0) return 0;
  return Math.round((productPriceCents * durationMinutes) / referenceMinutes);
}

// Resolves the reference duration a LESSON product's `priceCents` is quoted for.
// Falls back to the lesson type's canonical minutes for legacy products that
// don't have `referenceDurationMinutes` set yet.
export function referenceMinutesFor(product: {
  referenceDurationMinutes: number | null;
  lessonType: LessonType | null;
}): number {
  if (product.referenceDurationMinutes && product.referenceDurationMinutes > 0) {
    return product.referenceDurationMinutes;
  }
  const lt = product.lessonType ?? LessonType.PRIVATE;
  return LESSON_CANONICAL_MINUTES[lt];
}
