-- CreateTable
CREATE TABLE "SpecialEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "description" TEXT,
    "href" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecialEvent_date_key" ON "SpecialEvent"("date");

-- Seed the first event. There is no staff UI for events yet, so it ships
-- with the table.
INSERT INTO "SpecialEvent" ("date", "title", "shortLabel", "description", "href")
VALUES (
    '2026-10-09',
    'Pharaoh Airstyle',
    'Airstyle',
    'A day packed with activities, music, flavorful bites and high-flying tricks.',
    '/day-use/booking/pharaoh-airstyle'
)
ON CONFLICT ("date") DO NOTHING;
