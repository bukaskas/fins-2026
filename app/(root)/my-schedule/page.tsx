import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { authOptions } from "@/lib/auth";
import { getInstructorSessions } from "@/lib/actions/lessons.actions";
import { LessonBookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  RESERVED:  "Reserved",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  NO_SHOW:   "No Show",
  CANCELED:  "Canceled",
};

const STATUS_COLOR: Record<string, string> = {
  RESERVED:  "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  NO_SHOW:   "bg-red-100 text-red-700",
  CANCELED:  "bg-red-100 text-red-700",
};

function formatDuration(startsAt: Date, endsAt: Date) {
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function MySchedulePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");

  const user = session.user as any;
  const isInstructor = user.role === "INSTRUCTOR" || user.isInstructor === true;
  if (!isInstructor) redirect("/");

  const sp = await searchParams;

  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo   = format(endOfMonth(now), "yyyy-MM-dd");
  const from = sp.from ?? defaultFrom;
  const to   = sp.to   ?? defaultTo;

  const currentStart = new Date(`${from}T00:00:00Z`);
  const prevStart    = subMonths(currentStart, 1);
  const nextStart    = addMonths(currentStart, 1);
  const prevFrom = format(startOfMonth(prevStart), "yyyy-MM-dd");
  const prevTo   = format(endOfMonth(prevStart),   "yyyy-MM-dd");
  const nextFrom = format(startOfMonth(nextStart), "yyyy-MM-dd");
  const nextTo   = format(endOfMonth(nextStart),   "yyyy-MM-dd");

  const sessions = await getInstructorSessions(user.id, from, to);
  const monthLabel = format(currentStart, "MMMM yyyy");

  const todayStr = format(now, "yyyy-MM-dd");
  const upcoming = sessions.filter(
    (s) => format(new Date(s.startsAt), "yyyy-MM-dd") >= todayStr
  );
  const totalStudents = sessions.reduce((sum, s) => sum + s.bookings.length, 0);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">My Schedule</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user.name ?? user.email}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sessions this month</p>
          <p className="text-2xl font-bold mt-1">{sessions.length}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Upcoming</p>
          <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total students</p>
          <p className="text-2xl font-bold mt-1">{totalStudents}</p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/my-schedule?from=${prevFrom}&to=${prevTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          ← Prev
        </Link>
        <span className="font-medium text-sm">{monthLabel}</span>
        <Link
          href={`/my-schedule?from=${nextFrom}&to=${nextTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          Next →
        </Link>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">
          No sessions scheduled for {monthLabel}.
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const startsAt = new Date(s.startsAt);
            const endsAt   = new Date(s.endsAt);
            const isToday  = format(startsAt, "yyyy-MM-dd") === todayStr;
            const isPast   = format(startsAt, "yyyy-MM-dd") < todayStr;
            const bookingStatus = s.bookings[0]?.status ?? "";
            const students = s.bookings
              .map((b) => b.guest.name ?? b.guest.email)
              .join(", ") || "—";

            return (
              <div
                key={s.id}
                className={`rounded-xl border px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                  isToday
                    ? "border-primary/40 bg-primary/5"
                    : isPast
                    ? "opacity-60 bg-muted/20"
                    : "bg-white"
                }`}
              >
                {/* Date block */}
                <div className="flex sm:flex-col items-baseline sm:items-center gap-2 sm:gap-0 sm:w-16 shrink-0 sm:text-center">
                  <span className="text-lg font-bold leading-none">
                    {format(startsAt, "d")}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {format(startsAt, "MMM")}
                  </span>
                  {isToday && (
                    <span className="sm:mt-1 text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
                      Today
                    </span>
                  )}
                </div>

                <div className="hidden sm:block w-px h-10 bg-border shrink-0" />

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="font-medium text-sm">
                      {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(startsAt, endsAt)}
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {s.lessonType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {students}
                  </p>
                </div>

                {/* Status badge */}
                {bookingStatus && (
                  <span
                    className={`shrink-0 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      STATUS_COLOR[bookingStatus] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABEL[bookingStatus] ?? bookingStatus}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
