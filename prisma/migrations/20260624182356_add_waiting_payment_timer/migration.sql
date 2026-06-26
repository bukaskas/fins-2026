-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "waitingPaymentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_bookingStatus_waitingPaymentAt_idx" ON "Booking"("bookingStatus", "waitingPaymentAt");
