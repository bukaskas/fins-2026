import { getFutureKitesurfingBookings, type BookingWithAgent } from "@/lib/actions/booking.actions";
import {
  getLessonSessionsByDate,
  getAllLessons,
} from "@/lib/actions/lessons.actions";
import { listInstructors, listAgents } from "@/lib/actions/user.actions";
import { getAllProducts } from "@/lib/actions/product.actions";
import ScheduleBoard from "@/components/bookings/ScheduleBoard";
import type { SessionWithBookings, ServiceProduct } from "@/components/bookings/ScheduleBoard";
import BookingComponent from "@/components/kitesurfing/BookingComponent";
import { format } from "date-fns";
import { LessonsTable } from "@/components/lessons/LessonsTable";
import type { SessionRow } from "@/components/lessons/LessonSessionEditSheet";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SchedulePage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [sessions, instructors, futureResult, allLessonSessions, allUsers, productsRaw] =
    await Promise.all([
      getLessonSessionsByDate(today),
      listInstructors(),
      getFutureKitesurfingBookings(),
      getAllLessons(),
      listAgents(),
      getAllProducts({ type: "SERVICE", isActive: true }),
    ]);

  const serviceProducts: ServiceProduct[] = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
  }));

  const lessonRows: SessionRow[] = allLessonSessions.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    lessonType: s.lessonType,
    capacity: s.capacity,
    notes: s.notes,
    instructor: s.instructor,
    bookings: s.bookings.map((b) => ({
      id: b.id,
      status: b.status,
      guest: { id: b.guest.id, name: b.guest.name, email: b.guest.email, phone: b.guest.phone },
    })),
  }));

  const futureBookings = (
    futureResult.success ? futureResult.data : []
  ) as BookingWithAgent[];

  // group by date label
  const grouped = futureBookings.reduce<Record<string, BookingWithAgent[]>>((acc, b) => {
    const key = format(new Date(b.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="container mx-auto py-6 px-4 space-y-10">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold flex-1">Schedule</h1>
          <Link
            href="/lessons/new"
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors whitespace-nowrap"
          >
            + New Lesson
          </Link>
          <Link
            href="/students/new"
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors whitespace-nowrap"
          >
            + Add Student
          </Link>
        </div>
        <ScheduleBoard
          instructors={instructors}
          initialSessions={sessions as SessionWithBookings[]}
          initialDate={today}
          serviceProducts={serviceProducts}
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
                    <BookingComponent key={b.id} booking={b} allUsers={allUsers} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Lesson Bookings</h2>
        <LessonsTable
          lessons={lessonRows}
          instructors={instructors}
          serviceProducts={serviceProducts}
        />
      </div>
    </div>
  );
}
