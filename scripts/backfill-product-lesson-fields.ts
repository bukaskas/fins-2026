/* eslint-disable no-console */
import { prisma } from "@/db/prisma";
import { LessonType, ProductCategory } from "@prisma/client";
import { LESSON_CANONICAL_MINUTES, LESSON_TYPE_SKU } from "@/lib/lesson-products";

// Reverse of LESSON_TYPE_SKU: SKU → LessonType.
const SKU_TO_LESSON_TYPE: Record<string, LessonType> = Object.fromEntries(
  Object.entries(LESSON_TYPE_SKU).map(([lt, sku]) => [sku, lt as LessonType]),
);

async function main() {
  const products = await prisma.product.findMany({
    where: {
      category: ProductCategory.LESSONS,
      OR: [{ lessonType: null }, { referenceDurationMinutes: null }],
    },
    select: {
      id: true,
      sku: true,
      lessonType: true,
      referenceDurationMinutes: true,
    },
  });

  console.log(`Inspecting ${products.length} LESSONS-category products…`);

  let updated = 0;
  let unresolved = 0;

  for (const p of products) {
    const lt = p.lessonType ?? SKU_TO_LESSON_TYPE[p.sku] ?? null;
    if (!lt) {
      console.log(`  ✗ ${p.sku} — no lesson type, set it manually in /products.`);
      unresolved += 1;
      continue;
    }
    const refMin = p.referenceDurationMinutes ?? LESSON_CANONICAL_MINUTES[lt];

    await prisma.product.update({
      where: { id: p.id },
      data: {
        lessonType: lt,
        referenceDurationMinutes: refMin,
      },
    });
    console.log(`  ✓ ${p.sku} → lessonType=${lt}, referenceDurationMinutes=${refMin}`);
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated}, unresolved ${unresolved}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
