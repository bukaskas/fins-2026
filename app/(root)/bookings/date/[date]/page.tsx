import { getBookingsByDate } from "@/lib/actions/booking.actions";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { Button } from "@/components/ui/button";
import type { Booking } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function BookingsByDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const result = await getBookingsByDate(date);

  if (!result.success) {
    return <div>Error: {result.message}</div>;
  }

  const bookings = result.data as Booking[];

  const totalPeople = bookings.reduce((s, b) => s + b.numberOfPeople, 0);

  // Group by service
  const grouped = bookings.reduce(
    (acc, booking) => {
      const service = booking.service || "Unknown";
      if (!acc[service]) acc[service] = [];
      acc[service].push(booking);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );

  const formattedDate = format(new Date(date), "EEEE, MMMM d, yyyy");

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings/dashboard">← Dashboard</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{formattedDate}</h1>
            {bookings.length > 0 && (
              <p className="text-muted-foreground text-sm mt-1">
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""}{" "}
                &middot; {totalPeople} people
              </p>
            )}
          </div>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/kitesurfing/booking">Create New Booking</Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings for this date.</p>
      ) : (
        Object.entries(grouped).map(([service, serviceBookings]) => {
          // For kitesurfing, sub-group by instructor
          if (service === "kitesurfing-course") {
            const byInstructor = serviceBookings.reduce(
              (acc, b) => {
                const instructor = b.instructor || "Unassigned";
                if (!acc[instructor]) acc[instructor] = [];
                acc[instructor].push(b);
                return acc;
              },
              {} as Record<string, Booking[]>,
            );

            return (
              <div key={service} className="mb-8">
                <h3 className="text-2xl font-bold mb-4 border-b pb-2 capitalize">
                  {service.replace(/-/g, " ")}
                </h3>
                {Object.entries(byInstructor).map(([instructor, list]) => (
                  <div key={instructor} className="mb-5">
                    <h4 className="text-lg font-semibold mb-2 text-muted-foreground">
                      {instructor}
                    </h4>
                    <div className="space-y-2">
                      {list.map((b) => (
                        <BookingComponent key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div key={service} className="mb-8">
              <h3 className="text-2xl font-bold mb-4 border-b pb-2 capitalize">
                {service.replace(/-/g, " ")}
              </h3>
              <div className="space-y-2">
                {serviceBookings.map((b) => (
                  <BookingComponent key={b.id} booking={b} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default BookingsByDatePage;
