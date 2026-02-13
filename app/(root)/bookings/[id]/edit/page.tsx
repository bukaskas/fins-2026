import React from "react";

import BookingEditForm from "./BookingEditForm";
import { getBookingById } from "@/lib/actions/booking.actions";
import { Booking } from "@prisma/client";

async function BookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;

  if (!bookingId || typeof bookingId !== "string") {
    return <div>Invalid booking ID.</div>;
  }
  const booking = await getBookingById(bookingId);
  console.log("Booking details:", booking);
  // fetch booking details
  // add photo to medium size screens

  return <BookingEditForm booking={booking as Booking} />;
}

export default BookingEditPage;
