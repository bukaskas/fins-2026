import { getFutureKitesurfingBookings, type BookingWithAgent } from "@/lib/actions/booking.actions";
import {
  getLessonSessionsByDate,
  getAllLessons,
  getLessonFormUsers,
  getActiveLessonBundleProducts,
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
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  const [
    sessions,
    instructors,
    futureResult,
    allLessonSessions,
    allUsers,
    productsRaw,
    lessonFormUsers,
    bundleProducts,
  ] = await Promise.all([
    getLessonSessionsByDate(today),
    listInstructors(),
    getFutureKitesurfingBookings(),
    getAllLessons(),
    listAgents(),
    getAllProducts({ type: "SERVICE", isActive: true }),
    getLessonFormUsers(),
    getActiveLessonBundleProducts(),
  ]);

  const serviceProducts: ServiceProduct[] = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
  }));

  const sessionsTyped = sessions as SessionWithBookings[];

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

  const grouped = futureBookings.reduce<Record<string, BookingWithAgent[]>>((acc, b) => {
    const key = format(new Date(b.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  // ---------- Dashboard metrics ----------
  const todaysSessions = sessionsTyped.length;
  const todaysBookings = sessionsTyped.reduce((sum, s) => sum + s.bookings.length, 0);
  const instructorCount = instructors.length;

  const oneWeekOut = new Date(now);
  oneWeekOut.setDate(oneWeekOut.getDate() + 7);
  const weeklyArrivals = futureBookings
    .filter((b) => new Date(b.date) <= oneWeekOut)
    .reduce((s, b) => s + b.numberOfPeople, 0);

  const upcomingTodaySessions = sessionsTyped
    .filter((s) => new Date(s.endsAt) > now)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  const nextSession = upcomingTodaySessions[0] ?? null;

  return (
    <main
      className="min-h-screen font-(family-name:--font-geist-sans) text-stone-900 antialiased"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, #ffffff 0%, transparent 55%), linear-gradient(180deg, #f5f5f7 0%, #fafafa 40%, #f5f5f7 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12 lg:px-10 space-y-7">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.32em] text-stone-400">
              Fins Sokhna · Today
            </p>
            <h1 className="mt-2.5 flex items-baseline gap-3 text-4xl font-semibold tracking-[-0.02em] text-stone-900 md:text-5xl">
              <span>{format(now, "EEEE")}</span>
              <span className="font-light text-stone-400 tabular-nums">
                {format(now, "MMM d")}
              </span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/students/new"
              className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-[0.82rem] font-medium text-stone-700 backdrop-blur-xl transition-all hover:-translate-y-px hover:border-stone-300 hover:bg-white hover:shadow-sm"
            >
              + Add Student
            </Link>
            <Link
              href="/lessons/new"
              className="rounded-full bg-stone-900 px-4 py-2 text-[0.82rem] font-medium text-white transition-all hover:-translate-y-px hover:bg-stone-800 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]"
            >
              + New Lesson
            </Link>
          </div>
        </header>

        {/* Dashboard */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Lessons today"
            value={todaysSessions}
            sub={
              todaysBookings === 0
                ? "no bookings yet"
                : `${todaysBookings} ${todaysBookings === 1 ? "booking" : "bookings"}`
            }
          />
          <StatCard
            label="Students booked"
            value={todaysBookings}
            sub="across today's sessions"
          />
          <StatCard
            label="Instructors"
            value={instructorCount}
            sub={instructorCount === 1 ? "active" : "active on the team"}
          />
          <StatCard
            label="Arriving this week"
            value={weeklyArrivals}
            sub={
              weeklyArrivals === 1
                ? "kitesurfing guest"
                : "kitesurfing guests"
            }
            accent
          />
        </section>

        {/* Schedule board */}
        <SurfaceCard>
          <SurfaceHeader
            eyebrow="Schedule board"
            title="Today's sessions"
            aside={
              nextSession ? (
                <div className="text-right">
                  <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-stone-400">
                    Next up
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-700 tabular-nums">
                    {format(new Date(nextSession.startsAt), "HH:mm")}
                    <span className="ml-2 font-normal text-stone-400">
                      · {nextSession.instructor?.name ?? "Unassigned"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-stone-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    All done for today
                  </p>
                </div>
              )
            }
          />
          <ScheduleBoard
            instructors={instructors}
            initialSessions={sessionsTyped}
            initialDate={today}
            serviceProducts={serviceProducts}
            students={lessonFormUsers.students}
            bundleProducts={bundleProducts}
          />
        </SurfaceCard>

        {/* Upcoming kitesurfing bookings */}
        <SurfaceCard>
          <SurfaceHeader
            eyebrow="Kitesurfing"
            title="Upcoming bookings"
            aside={
              <span className="text-sm font-medium tabular-nums text-stone-500">
                {futureBookings.length} total
              </span>
            }
          />

          {sortedDates.length === 0 ? (
            <p className="px-1 text-sm text-stone-500">
              No upcoming bookings.
            </p>
          ) : (
            <div className="space-y-7">
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <div className="mb-3 flex items-baseline gap-3 border-b border-stone-200/70 pb-2">
                    <h3 className="text-[0.95rem] font-semibold tracking-tight text-stone-800">
                      {format(
                        new Date(dateKey + "T00:00:00"),
                        "EEEE, d MMMM",
                      )}
                    </h3>
                    <span className="text-xs font-medium text-stone-400 tabular-nums">
                      ·{" "}
                      {grouped[dateKey].reduce(
                        (s, b) => s + b.numberOfPeople,
                        0,
                      )}{" "}
                      people
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped[dateKey].map((b) => (
                      <BookingComponent
                        key={b.id}
                        booking={b}
                        allUsers={allUsers}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* Lesson bookings table */}
        <SurfaceCard>
          <SurfaceHeader
            eyebrow="Lessons"
            title="All lesson bookings"
          />
          <LessonsTable
            lessons={lessonRows}
            instructors={instructors}
            serviceProducts={serviceProducts}
          />
        </SurfaceCard>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.75rem] border border-stone-200/70 bg-white/75 p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white"
      style={{
        boxShadow:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -20px rgba(15, 23, 42, 0.18)",
      }}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.45) 0%, transparent 70%)",
          }}
        />
      )}
      <div className="relative">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.3em] text-stone-400">
          {label}
        </p>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[2.2rem] font-semibold tracking-[-0.03em] tabular-nums text-stone-900 leading-none">
            {value}
          </span>
          {accent && (
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-sky-600">
              · 7d
            </span>
          )}
        </div>
        <p className="mt-2 text-[0.78rem] text-stone-500">{sub}</p>
      </div>
    </div>
  );
}

function SurfaceCard({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-[2rem] border border-stone-200/70 bg-white/70 p-5 backdrop-blur-2xl md:p-6"
      style={{
        boxShadow:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 18px 48px -28px rgba(15, 23, 42, 0.22)",
      }}
    >
      {children}
    </section>
  );
}

function SurfaceHeader({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.3em] text-stone-400">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.02em] text-stone-900">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}
