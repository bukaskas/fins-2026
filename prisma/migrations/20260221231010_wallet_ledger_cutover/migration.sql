/*
  Warnings:

  - You are about to drop the `UserCreditGrant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserCreditUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserCreditGrant" DROP CONSTRAINT "UserCreditGrant_productId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditGrant" DROP CONSTRAINT "UserCreditGrant_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditUsage" DROP CONSTRAINT "UserCreditUsage_beachVisitId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditUsage" DROP CONSTRAINT "UserCreditUsage_grantId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditUsage" DROP CONSTRAINT "UserCreditUsage_lessonBookingId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditUsage" DROP CONSTRAINT "UserCreditUsage_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "UserCreditUsage" DROP CONSTRAINT "UserCreditUsage_userId_fkey";

-- DropTable
DROP TABLE "UserCreditGrant";

-- DropTable
DROP TABLE "UserCreditUsage";
