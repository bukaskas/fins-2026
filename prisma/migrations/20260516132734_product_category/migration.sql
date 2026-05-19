-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('BEACH_USE', 'RENTAL', 'LESSONS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "ProductCategory";

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- Backfill known products
UPDATE "Product" SET "category" = 'RENTAL'    WHERE "sku" = 'RENTAL_SERVICE';
UPDATE "Product" SET "category" = 'BEACH_USE' WHERE "sku" = 'BEACH_USE_DAY';
UPDATE "Product" SET "category" = 'BEACH_USE' WHERE "category" IS NULL AND "walletType" = 'BEACH_USE';
UPDATE "Product" SET "category" = 'LESSONS'   WHERE "category" IS NULL AND "walletType" = 'LESSON_HOURS';
