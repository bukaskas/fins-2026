CREATE TYPE "BookingContactChannel" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'OTHER');

CREATE TYPE "BookingContactOutcome" AS ENUM ('ATTEMPTED', 'REACHED', 'NO_RESPONSE', 'FOLLOW_UP');

CREATE TABLE "BookingContact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "actorId" UUID,
    "channel" "BookingContactChannel" NOT NULL,
    "outcome" "BookingContactOutcome" NOT NULL,
    "note" TEXT,
    "nextContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingContact_bookingId_createdAt_idx" ON "BookingContact"("bookingId", "createdAt");
CREATE INDEX "BookingContact_nextContactAt_idx" ON "BookingContact"("nextContactAt");

ALTER TABLE "BookingContact"
ADD CONSTRAINT "BookingContact_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingContact"
ADD CONSTRAINT "BookingContact_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
