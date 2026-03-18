-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PAID', 'PARTIAL', 'CANCELED');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('ANNUAL', 'MONTHLY', 'SEASONAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'DISCOUNT');

-- AlterTable: Order.status TEXT -> OrderStatus
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"OrderStatus";

-- AlterTable: Member.membershipType TEXT -> MembershipType
ALTER TABLE "Member" ALTER COLUMN "membershipType" TYPE "MembershipType" USING "membershipType"::"MembershipType";

-- AlterTable: Payment.method TEXT -> PaymentMethod
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod" USING "method"::"PaymentMethod";

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");
