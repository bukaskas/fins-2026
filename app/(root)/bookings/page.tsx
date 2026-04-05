import {
  getAllBookings,
  getFutureBookingPeopleTotalsByDate,
} from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { Button } from "@/components/ui/button";
import type { Booking } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function BookingsPage() {
  const bookingsResult = await getAllBookings();
  const totalsResult = await getFutureBookingPeopleTotalsByDate();

  if (!bookingsResult.success) {
    return <div>Error: {bookingsResult.message}</div>;
  }

  const bookings = bookingsResult.data as Booking[];

  // Group bookings by service, then by instructor
  const groupedBookings = bookings.reduce(
    (acc, booking) => {
      const service = booking.service || "Unknown";
      const instructor = booking.instructor || "Unassigned";
      if (!acc[service]) acc[service] = {};
      if (!acc[service][instructor]) acc[service][instructor] = [];
      acc[service][instructor].push(booking);
      return acc;
    },
    {} as Record<string, Record<string, Booking[]>>,
  );

  // Get totals data
  const totalsData = totalsResult.success
    ? (totalsResult.data as { date: Date; totalPeople: number }[])
    : [];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <Button asChild className="rounded-full">
          <Link href="/kitesurfing/booking">Create New Booking</Link>
        </Button>
      </div>

      <div className="mb-8 flex gap-3 flex-wrap">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/bookings/dashboard">Dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/bookings/kitesurfing">Kitesurfing</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/bookings/day-use">Day Use</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/bookings/restaurant">Restaurant</Link>
        </Button>
      </div>
      {/* Future Bookings Totals Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Daily Booking Summary (Future Dates)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Date
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Total People
                </th>
              </tr>
            </thead>
            <tbody>
              {totalsData.length > 0 ? (
                totalsData.map((total, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {format(new Date(total.date), "MMM dd, yyyy")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      {total.totalPeople}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                  >
                    No future bookings
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Bookings List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
        {Object.entries(groupedBookings).map(([service, byInstructor]) => (
          <div key={service} className="mb-10">
            <h3 className="text-2xl font-bold mb-4 border-b pb-2">{service}</h3>
            {Object.entries(byInstructor).map(([instructor, instructorBookings]) => {
              const sortedBookings = [...instructorBookings].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA !== dateB) return dateA - dateB;
                if (a.time && b.time) return a.time.localeCompare(b.time);
                if (a.time) return -1;
                if (b.time) return 1;
                return 0;
              });

              return (
                <div key={instructor} className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-muted-foreground">{instructor}</h4>
                  <div className="space-y-2">
                    {sortedBookings.map((booking: Booking) => (
                      <BookingComponent key={booking.id} booking={booking} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingsPage;
