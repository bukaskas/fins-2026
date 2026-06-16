-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "flashOrderId" TEXT,
ADD COLUMN "paymentLink" TEXT,
ADD COLUMN "paymentLinkExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BookingPayment" ADD COLUMN "flashTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookingPayment_flashTransactionId_key" ON "BookingPayment"("flashTransactionId");
