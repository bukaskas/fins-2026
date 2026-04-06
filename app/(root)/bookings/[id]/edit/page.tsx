import BookingEditForm from "./BookingEditForm";
import { getBookingById } from "@/lib/actions/booking.actions";
import { listInstructors } from "@/lib/actions/user.actions";
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
  const [booking, instructors] = await Promise.all([
    getBookingById(bookingId),
    listInstructors(),
  ]);

  return <BookingEditForm booking={booking as Booking} instructors={instructors} />;
}

export default BookingEditPage;
