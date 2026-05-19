/*
  Warnings:

  - You are about to drop the column `productId` on the `Rental` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderLineId` to the `RentalLine` table without a default value. This is not possible if the table is not empty.

  Dev DB only: existing rentals are wiped and inventory availability is reset
  to match totalQty so stock is consistent after the structural change.
*/

-- Wipe existing rental data (dev-only structural change)
DELETE FROM "InventoryMovement" WHERE "rentalLineId" IS NOT NULL;
DELETE FROM "RentalLine";
DELETE FROM "Rental";

-- Reset inventory availability so it matches totalQty
UPDATE "InventoryItem" SET "availableQty" = "totalQty";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_productId_fkey";

-- DropIndex
DROP INDEX "Rental_productId_idx";

-- AlterTable
ALTER TABLE "Rental" DROP COLUMN "productId",
ADD COLUMN     "orderId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "RentalLine" ADD COLUMN     "orderLineId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Rental_orderId_idx" ON "Rental"("orderId");

-- CreateIndex
CREATE INDEX "RentalLine_orderLineId_idx" ON "RentalLine"("orderLineId");

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLine" ADD CONSTRAINT "RentalLine_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
