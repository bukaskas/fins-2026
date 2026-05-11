import BookingEditForm from "./BookingEditForm";
import { getBookingById, type BookingWithAgent } from "@/lib/actions/booking.actions";
import { listInstructors, listUsers } from "@/lib/actions/user.actions";

async function BookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;

  if (!bookingId || typeof bookingId !== "string") {
    return <div>Invalid booking ID.</div>;
  }
  const [booking, instructors, allUsers] = await Promise.all([
    getBookingById(bookingId),
    listInstructors(),
    listUsers(),
  ]);

  return <BookingEditForm booking={booking as BookingWithAgent} instructors={instructors} allUsers={allUsers} />;
}

export default BookingEditPage;
