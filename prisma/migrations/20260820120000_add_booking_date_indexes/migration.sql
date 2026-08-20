-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "Booking_bookingStatus_date_idx" ON "Booking"("bookingStatus", "date");
