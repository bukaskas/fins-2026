-- CreateEnum
CREATE TYPE "BookingGroup" AS ENUM ('KAI_OWNER', 'KITE_COMMUNITY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "bookingGroup" "BookingGroup",
ADD COLUMN "groupDetail" TEXT;

-- CreateIndex
CREATE INDEX "Booking_bookingGroup_idx" ON "Booking"("bookingGroup");
