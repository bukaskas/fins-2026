-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DEPOSIT_PAID', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
