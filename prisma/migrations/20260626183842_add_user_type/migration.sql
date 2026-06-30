-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'BLACKLIST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'LEVEL_1';
