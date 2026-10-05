-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "paymentRequestEmailWindowAt" TIMESTAMP(3),
ADD COLUMN "cancellationEmailSentAt" TIMESTAMP(3);

-- Bookings canceled before this email existed must not all receive one on the
-- first cron run after deploy.
UPDATE "Booking" SET "cancellationEmailSentAt" = CURRENT_TIMESTAMP WHERE "bookingStatus" = 'CANCELED';
