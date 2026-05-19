-- DropIndex
DROP INDEX "Rental_status_dueAt_idx";

-- AlterTable
ALTER TABLE "Rental" ALTER COLUMN "dueAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RentalLine" ADD COLUMN     "returnedAt" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "Rental_status_startsAt_idx" ON "Rental"("status", "startsAt");

-- CreateIndex
CREATE INDEX "RentalLine_rentalId_returnedAt_idx" ON "RentalLine"("rentalId", "returnedAt");
