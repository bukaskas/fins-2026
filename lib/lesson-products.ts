import { LessonType, Prisma } from "@prisma/client";

export const LESSON_TYPE_SKU: Record<LessonType, string> = {
  PRIVATE: "LESSON_PRIVATE",
  GROUP: "LESSON_GROUP",
  EXTRA_PRIVATE: "LESSON_EXTRA_PRIVATE",
  EXTRA_GROUP: "LESSON_EXTRA_GROUP",
  FOIL: "LESSON_FOIL",
  KIDS: "LESSON_KIDS",
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
