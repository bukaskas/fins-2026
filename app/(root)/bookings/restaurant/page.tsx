import { getBookingsByService } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { Button } from "@/components/ui/button";
import type { Booking } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function RestaurantBookingsPage() {
  const result = await getBookingsByService("restaurant");

  if (!result.success) {
    return <div>Error: {result.message}</div>;
  }

  const bookings = result.data as Booking[];

  const sorted = [...bookings].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings">← All Bookings</Link>
          </Button>
          <h1 className="text-3xl font-bold">Restaurant Bookings</h1>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/kitesurfing/booking">Create New Booking</Link>
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground">No restaurant bookings found.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((booking) => (
            <BookingComponent key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RestaurantBookingsPage;
