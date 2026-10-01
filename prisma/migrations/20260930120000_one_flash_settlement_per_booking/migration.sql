-- A booking can have many manual payments, but at most one Flash-originated
-- settlement. Keeping this as a partial unique index preserves that distinction
-- while making concurrent webhook/reconciliation races safe at database level.
CREATE UNIQUE INDEX "BookingPayment_one_flash_settlement_per_booking"
ON "BookingPayment" ("bookingId")
WHERE "flashTransactionId" IS NOT NULL;
