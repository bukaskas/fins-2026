-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('PRIVATE', 'SEMI_PRIVATE', 'GROUP', 'FOIL', 'KIDS');

-- CreateEnum
CREATE TYPE "LessonBookingStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELED');

-- CreateEnum
CREATE TYPE "BeachUseType" AS ENUM ('REGULAR', 'LOCAL', 'MEMBER_FREE');

-- CreateEnum
CREATE TYPE "BeachVisitStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('KITE', 'BOARD', 'HARNESS', 'BAR', 'WETSUIT', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('OPEN', 'RETURNED', 'LATE', 'CANCELED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'MAINTENANCE', 'LOST');

-- AlterTable
ALTER TABLE "UserCreditUsage" ADD COLUMN     "beachVisitId" UUID,
ADD COLUMN     "lessonBookingId" UUID,
ADD COLUMN     "rentalId" UUID;

-- CreateTable
CREATE TABLE "LessonSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "startsAt" TIMESTAMP(6) NOT NULL,
    "endsAt" TIMESTAMP(6) NOT NULL,
    "lessonType" "LessonType" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "instructorId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonBooking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "guestId" UUID NOT NULL,
    "status" "LessonBookingStatus" NOT NULL DEFAULT 'RESERVED',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(6),
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachVisit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guestId" UUID NOT NULL,
    "visitDate" DATE NOT NULL,
    "type" "BeachUseType" NOT NULL,
    "status" "BeachVisitStatus" NOT NULL DEFAULT 'OPEN',
    "checkedInAt" TIMESTAMP(6),
    "checkedOutAt" TIMESTAMP(6),
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeachVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guestId" UUID NOT NULL,
    "startsAt" TIMESTAMP(6) NOT NULL,
    "dueAt" TIMESTAMP(6) NOT NULL,
    "returnedAt" TIMESTAMP(6),
    "status" "RentalStatus" NOT NULL DEFAULT 'OPEN',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalLine" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rentalId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "size" TEXT,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventoryItemId" UUID NOT NULL,
    "rentalLineId" UUID,
    "actorId" UUID,
    "type" "InventoryMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonSession_startsAt_idx" ON "LessonSession"("startsAt");

-- CreateIndex
CREATE INDEX "LessonSession_instructorId_startsAt_idx" ON "LessonSession"("instructorId", "startsAt");

-- CreateIndex
CREATE INDEX "LessonBooking_guestId_createdAt_idx" ON "LessonBooking"("guestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBooking_sessionId_guestId_key" ON "LessonBooking"("sessionId", "guestId");

-- CreateIndex
CREATE INDEX "BeachVisit_guestId_visitDate_idx" ON "BeachVisit"("guestId", "visitDate");

-- CreateIndex
CREATE INDEX "Rental_guestId_startsAt_idx" ON "Rental"("guestId", "startsAt");

-- CreateIndex
CREATE INDEX "Rental_status_dueAt_idx" ON "Rental"("status", "dueAt");

-- CreateIndex
CREATE INDEX "RentalLine_rentalId_idx" ON "RentalLine"("rentalId");

-- CreateIndex
CREATE INDEX "RentalLine_inventoryItemId_idx" ON "RentalLine"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryItem_category_isActive_idx" ON "InventoryItem"("category", "isActive");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryItemId_createdAt_idx" ON "InventoryMovement"("inventoryItemId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UserCreditUsage_lessonBookingId_idx" ON "UserCreditUsage"("lessonBookingId");

-- CreateIndex
CREATE INDEX "UserCreditUsage_beachVisitId_idx" ON "UserCreditUsage"("beachVisitId");

-- CreateIndex
CREATE INDEX "UserCreditUsage_rentalId_idx" ON "UserCreditUsage"("rentalId");

-- AddForeignKey
ALTER TABLE "UserCreditUsage" ADD CONSTRAINT "UserCreditUsage_lessonBookingId_fkey" FOREIGN KEY ("lessonBookingId") REFERENCES "LessonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreditUsage" ADD CONSTRAINT "UserCreditUsage_beachVisitId_fkey" FOREIGN KEY ("beachVisitId") REFERENCES "BeachVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreditUsage" ADD CONSTRAINT "UserCreditUsage_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBooking" ADD CONSTRAINT "LessonBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBooking" ADD CONSTRAINT "LessonBooking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachVisit" ADD CONSTRAINT "BeachVisit_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLine" ADD CONSTRAINT "RentalLine_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLine" ADD CONSTRAINT "RentalLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_rentalLineId_fkey" FOREIGN KEY ("rentalLineId") REFERENCES "RentalLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
