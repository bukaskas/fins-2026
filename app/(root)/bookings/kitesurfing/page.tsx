import { getBookingsByService } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { Button } from "@/components/ui/button";
import type { Booking } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function KitesurfingBookingsPage() {
  const result = await getBookingsByService("kitesurfing-course");

  if (!result.success) {
    return <div>Error: {result.message}</div>;
  }

  const bookings = result.data as Booking[];

  const groupedByInstructor = bookings.reduce(
    (acc, booking) => {
      const instructor = booking.instructor || "Unassigned";
      if (!acc[instructor]) acc[instructor] = [];
      acc[instructor].push(booking);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings">← All Bookings</Link>
          </Button>
          <h1 className="text-3xl font-bold">Kitesurfing Bookings</h1>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/day-use/booking">Create New Booking</Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No kitesurfing bookings found.</p>
      ) : (
        Object.entries(groupedByInstructor).map(([instructor, instructorBookings]) => {
          const sorted = [...instructorBookings].sort((a, b) => {
            const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (diff !== 0) return diff;
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
          });

          return (
            <div key={instructor} className="mb-8">
              <h3 className="text-xl font-semibold mb-3">{instructor}</h3>
              <div className="space-y-2">
                {sorted.map((booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default KitesurfingBookingsPage;
