-- CreateEnum
CREATE TYPE "RevenueSource" AS ENUM ('BUNDLE', 'ORDER', 'FREE');

-- AlterTable
ALTER TABLE "LessonSession" ADD COLUMN     "deliveredRevenueCents" INTEGER,
ADD COLUMN     "revenueSource" "RevenueSource";
