-- Which Flash order attempt is live for a booking. Existing rows keep the bare
-- booking id as their aggregatorOrderId, which is attempt 1 — hence the default.
ALTER TABLE "Booking" ADD COLUMN "paymentLinkAttempt" INTEGER NOT NULL DEFAULT 1;

-- Backfill an expiry for links issued before `validity` was sent to Flash.
--
-- Those orders carry Flash's own undocumented default, so their true expiry is
-- unknowable from here; the booking's 24h hold is the honest inference, and it
-- matches the documented instapay default (86400s). Without this, a legacy link
-- reads as "never expires", which would keep the desk handing back a dead link
-- with no way to replace it.
--
-- Rows with no `waitingPaymentAt` are left null: nothing to infer from, and the
-- code treats null as live — the behaviour they have today.
UPDATE "Booking"
SET "paymentLinkExpiresAt" = "waitingPaymentAt" + INTERVAL '24 hours'
WHERE "paymentLink" IS NOT NULL
  AND "paymentLinkExpiresAt" IS NULL
  AND "waitingPaymentAt" IS NOT NULL;
