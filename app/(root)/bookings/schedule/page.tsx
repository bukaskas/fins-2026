import { getFutureKitesurfingBookings } from "@/lib/actions/booking.actions";
import {
  getLessonSessionsByDate,
  getAllLessons,
} from "@/lib/actions/lessons.actions";
import { listInstructors } from "@/lib/actions/user.actions";
import ScheduleBoard from "@/components/bookings/ScheduleBoard";
import type { SessionWithBookings } from "@/components/bookings/ScheduleBoard";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { format } from "date-fns";
import type { Booking } from "@prisma/client";
import {
  LessonBookingsTable,
  type LessonBookingRow,
} from "@/components/bookings/LessonBookingsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SchedulePage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [sessions, instructors, futureResult, allLessonSessions] =
    await Promise.all([
      getLessonSessionsByDate(today),
      listInstructors(),
      getFutureKitesurfingBookings(),
      getAllLessons(),
    ]);

  const allLessonBookings: LessonBookingRow[] = allLessonSessions.flatMap((s) =>
    s.bookings.map((b) => ({
      id: b.id,
      status: b.status,
      attended: b.attended,
      notes: b.notes ?? null,
      guest: b.guest,
      session: {
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        lessonType: s.lessonType,
        capacity: s.capacity,
        instructor: s.instructor,
      },
    })),
  );

  const futureBookings = (
    futureResult.success ? futureResult.data : []
  ) as Booking[];

  // group by date label
  const grouped = futureBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = format(new Date(b.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="container mx-auto py-6 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-4">Schedule</h1>
        <ScheduleBoard
          instructors={instructors}
          initialSessions={sessions as SessionWithBookings[]}
          initialDate={today}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Upcoming Kitesurfing Bookings
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({futureBookings.length} total)
          </span>
        </h2>

        {sortedDates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No upcoming kitesurfing bookings.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                  {format(new Date(dateKey + "T00:00:00"), "EEEE, d MMMM yyyy")}
                  <span className="ml-2 font-normal">
                    ·{" "}
                    {grouped[dateKey].reduce(
                      (sum, b) => sum + b.numberOfPeople,
                      0,
                    )}{" "}
                    people
                  </span>
                </h3>
                <div className="space-y-2">
                  {grouped[dateKey].map((b) => (
                    <BookingComponent key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Lesson Bookings
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({allLessonBookings.length} total)
          </span>
        </h2>

        <LessonBookingsTable
          bookings={allLessonBookings}
          instructors={instructors}
        />
      </div>
    </div>
  );
}
