import { getAllBookings } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import type { Booking } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function BookingsPage() {
  const result = await getAllBookings();

  if (!result.success) {
    return <div>Error: {result.message}</div>;
  }
  const bookings = result.data as Booking[];
  // Group bookings by instructor
  const groupedBookings = bookings.reduce(
    (acc, booking) => {
      const instructor = booking.instructor || "Unassigned";
      if (!acc[instructor]) {
        acc[instructor] = [];
      }
      acc[instructor].push(booking);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );
  console;
  return (
    <div>
      <div>Bookings page</div>
      {Object.entries(groupedBookings).map(
        ([instructor, instructorBookings]) => {
          // Sort by date, then by time (if present)
          const sortedBookings = [...instructorBookings].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            // If dates are equal, sort by time (assumes "HH:mm" format or null)
            if (a.time && b.time) {
              return a.time.localeCompare(b.time);
            }
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
          });

          return (
            <div key={instructor} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{instructor}</h2>
              <div className="space-y-2">
                {sortedBookings.map((booking: Booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

export default BookingsPage;
