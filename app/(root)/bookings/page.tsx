import { getAllBookings } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import type { Booking } from "@prisma/client";
async function BookingsPage() {
  const result = await getAllBookings();
  if (!result.success) {
    return <div>Error: {result.message}</div>;
  }

  return (
    <div>
      <div>Bookings page</div>
      {(result.data ?? []).map((booking: Booking) => (
        <BookingComponent key={booking.id} booking={booking} />
      ))}
    </div>
  );
}

export default BookingsPage;
