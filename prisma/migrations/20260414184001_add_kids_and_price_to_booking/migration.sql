-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DAYPASS';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "numberOfKids" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPriceCents" INTEGER;
