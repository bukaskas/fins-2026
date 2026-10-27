-- REQUEST_SENT becomes CONTACTED: the status now means "staff reached out and
-- are waiting on the guest", set by the first logged contact. Renaming the
-- value in place keeps every existing booking and BookingEvent row.
ALTER TYPE "BookingStatus" RENAME VALUE 'REQUEST_SENT' TO 'CONTACTED';

-- Bookings staff already messaged before this change are CONTACTED too, with
-- the move recorded at their first contact, by whoever made it.
WITH first_contact AS (
  SELECT DISTINCT ON (c."bookingId") c."bookingId", c."actorId", c."createdAt"
  FROM "BookingContact" c
  JOIN "Booking" b ON b.id = c."bookingId"
  WHERE b."bookingStatus" = 'PENDING'
  ORDER BY c."bookingId", c."createdAt"
),
moved AS (
  UPDATE "Booking" b
  SET "bookingStatus" = 'CONTACTED'
  FROM first_contact f
  WHERE b.id = f."bookingId"
  RETURNING b.id
)
INSERT INTO "BookingEvent" ("bookingId", source, "actorId", "fromStatus", "toStatus", "createdAt")
SELECT f."bookingId", 'STAFF', f."actorId", 'PENDING', 'CONTACTED', f."createdAt"
FROM first_contact f
JOIN moved m ON m.id = f."bookingId";
