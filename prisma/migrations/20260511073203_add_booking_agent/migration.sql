-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "agentId" UUID;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
