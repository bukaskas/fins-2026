-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserWallet" DROP CONSTRAINT "UserWallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletLedger" DROP CONSTRAINT "WalletLedger_walletId_fkey";

-- DropForeignKey
ALTER TABLE "WalletLedger" DROP CONSTRAINT "WalletLedger_userId_fkey";

-- DropForeignKey
ALTER TABLE "LessonBooking" DROP CONSTRAINT "LessonBooking_guestId_fkey";

-- DropForeignKey
ALTER TABLE "BeachVisit" DROP CONSTRAINT "BeachVisit_guestId_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_guestId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LessonBooking" ADD COLUMN     "orderId" UUID;

-- CreateIndex
CREATE INDEX "LessonBooking_orderId_idx" ON "LessonBooking"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "UserWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBooking" ADD CONSTRAINT "LessonBooking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBooking" ADD CONSTRAINT "LessonBooking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachVisit" ADD CONSTRAINT "BeachVisit_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

