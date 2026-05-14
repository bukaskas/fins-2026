-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PRIVATE', 'SEMI_PRIVATE', 'EXTRA_PRIVATE', 'EXTRA_SEMI_PRIVATE', 'FOIL', 'KIDS');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "InstructorProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "privateRateCents" INTEGER NOT NULL DEFAULT 0,
    "semiPrivateRateCents" INTEGER NOT NULL DEFAULT 0,
    "extraPrivateRateCents" INTEGER NOT NULL DEFAULT 0,
    "extraSemiPrivateRateCents" INTEGER NOT NULL DEFAULT 0,
    "foilRateCents" INTEGER NOT NULL DEFAULT 0,
    "kidsRateCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorCommission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "rateAtCreationCents" INTEGER NOT NULL,
    "calculatedAmountCents" INTEGER NOT NULL,
    "overrideAmountCents" INTEGER,
    "finalAmountCents" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" UUID,
    "paidAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstructorProfile_userId_key" ON "InstructorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorCommission_sessionId_key" ON "InstructorCommission"("sessionId");

-- CreateIndex
CREATE INDEX "InstructorCommission_instructorId_status_idx" ON "InstructorCommission"("instructorId", "status");

-- CreateIndex
CREATE INDEX "InstructorCommission_paymentId_idx" ON "InstructorCommission"("paymentId");

-- AddForeignKey
ALTER TABLE "InstructorProfile" ADD CONSTRAINT "InstructorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCommission" ADD CONSTRAINT "InstructorCommission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCommission" ADD CONSTRAINT "InstructorCommission_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCommission" ADD CONSTRAINT "InstructorCommission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
