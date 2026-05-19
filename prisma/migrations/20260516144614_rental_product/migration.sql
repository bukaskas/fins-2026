-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "productId" UUID;

-- CreateIndex
CREATE INDEX "Rental_productId_idx" ON "Rental"("productId");

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
