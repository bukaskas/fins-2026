-- The payment deadline is stored instead of derived from waitingPaymentAt + 24h:
-- the clock now starts at the guest's first payment link.
ALTER TABLE "Booking" ADD COLUMN "paymentDueAt" TIMESTAMP(3),
ADD COLUMN "dateFullNoticeAt" TIMESTAMP(3);

-- Bookings already waiting keep the deadline they were promised.
UPDATE "Booking"
SET "paymentDueAt" = "waitingPaymentAt" + INTERVAL '24 hours'
WHERE "bookingStatus" = 'WAITING_PAYMENT' AND "waitingPaymentAt" IS NOT NULL;

-- DropIndex
DROP INDEX "Booking_bookingStatus_waitingPaymentAt_idx";

-- CreateIndex
CREATE INDEX "Booking_bookingStatus_paymentDueAt_idx" ON "Booking"("bookingStatus", "paymentDueAt");
