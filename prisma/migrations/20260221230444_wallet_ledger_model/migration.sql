/*
  Warnings:

  - The values [SEMI_PRIVATE] on the enum `LessonType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('BEACH_USE', 'LESSON_HOURS');

-- CreateEnum
CREATE TYPE "WalletUnit" AS ENUM ('ENTRY', 'HOUR');

-- CreateEnum
CREATE TYPE "WalletLedgerReason" AS ENUM ('PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'REFUND', 'EXPIRY', 'MIGRATION');

-- AlterEnum
BEGIN;
CREATE TYPE "LessonType_new" AS ENUM ('PRIVATE', 'GROUP', 'EXTRA_PRIVATE', 'EXTRA_GROUP', 'FOIL', 'KIDS');
ALTER TABLE "LessonSession" ALTER COLUMN "lessonType" TYPE "LessonType_new" USING ("lessonType"::text::"LessonType_new");
ALTER TYPE "LessonType" RENAME TO "LessonType_old";
ALTER TYPE "LessonType_new" RENAME TO "LessonType";
DROP TYPE "public"."LessonType_old";
COMMIT;

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "WalletType" NOT NULL,
    "unit" "WalletUnit" NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actorId" UUID,
    "delta" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "reason" "WalletLedgerReason" NOT NULL,
    "note" TEXT,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID,
    "orderLineId" UUID,
    "paymentId" UUID,
    "lessonBookingId" UUID,
    "beachVisitId" UUID,
    "rentalId" UUID,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserWallet_type_idx" ON "UserWallet"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_type_key" ON "UserWallet"("userId", "type");

-- CreateIndex
CREATE INDEX "WalletLedger_walletId_occurredAt_idx" ON "WalletLedger"("walletId", "occurredAt");

-- CreateIndex
CREATE INDEX "WalletLedger_userId_occurredAt_idx" ON "WalletLedger"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "WalletLedger_reason_occurredAt_idx" ON "WalletLedger"("reason", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletLedger_walletId_idempotencyKey_key" ON "WalletLedger"("walletId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_lessonBookingId_fkey" FOREIGN KEY ("lessonBookingId") REFERENCES "LessonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_beachVisitId_fkey" FOREIGN KEY ("beachVisitId") REFERENCES "BeachVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
