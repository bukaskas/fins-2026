-- Add new amountPaidCents column
ALTER TABLE "Booking" ADD COLUMN "amountPaidCents" INTEGER NOT NULL DEFAULT 0;

-- Backfill: PAID bookings → 50% of totalPriceCents; all others stay 0
UPDATE "Booking"
SET "amountPaidCents" = COALESCE("totalPriceCents", 0) / 2
WHERE "paymentStatus" = 'PAID';

-- Drop old paymentStatus column
ALTER TABLE "Booking" DROP COLUMN "paymentStatus";

-- Drop PaymentStatus enum
DROP TYPE "PaymentStatus";
