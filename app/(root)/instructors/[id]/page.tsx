import { notFound } from "next/navigation";
import Link from "next/link";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/db/prisma";
import { getInstructorSessions } from "@/lib/actions/lessons.actions";
import { LESSON_PRICES_EGP, COMMISSION_RATE } from "@/lib/pricing";
import { LessonBookingStatus, LessonType } from "@prisma/client";

export const dynamic = "force-dynamic";

const QUALIFYING_STATUSES: LessonBookingStatus[] = [
  LessonBookingStatus.CONFIRMED,
  LessonBookingStatus.COMPLETED,
];

function formatDuration(startsAt: Date, endsAt: Date) {
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatEGP(egp: number) {
  return `${egp.toLocaleString("en-EG")} EGP`;
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function InstructorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const instructor = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!instructor) notFound();

  // Date range — default to current month
  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");
  const from = sp.from ?? defaultFrom;
  const to = sp.to ?? defaultTo;

  // Month nav helpers — parse from the "from" date
  const currentStart = new Date(`${from}T00:00:00Z`);
  const prevStart = subMonths(currentStart, 1);
  const nextStart = addMonths(currentStart, 1);

  const prevFrom = format(startOfMonth(prevStart), "yyyy-MM-dd");
  const prevTo = format(endOfMonth(prevStart), "yyyy-MM-dd");
  const nextFrom = format(startOfMonth(nextStart), "yyyy-MM-dd");
  const nextTo = format(endOfMonth(nextStart), "yyyy-MM-dd");

  const sessions = await getInstructorSessions(id, from, to);

  // Commission totals — only qualifying sessions
  const qualifyingSessions = sessions.filter((s) =>
    s.bookings.some((b) => QUALIFYING_STATUSES.includes(b.status as LessonBookingStatus))
  );

  const totalCommission = qualifyingSessions.reduce((sum, s) => {
    const price = LESSON_PRICES_EGP[s.lessonType as LessonType] ?? 0;
    return sum + price * COMMISSION_RATE;
  }, 0);

  const monthLabel = format(currentStart, "MMMM yyyy");

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/instructors" className="text-sm text-muted-foreground hover:underline">
          ← Instructors
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{instructor.name ?? "Unnamed instructor"}</h1>
            <p className="text-sm text-muted-foreground">{instructor.email}</p>
          </div>

          {/* Commission summary card */}
          <div className="rounded-lg border bg-muted/30 px-5 py-4 min-w-[200px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Commission due</p>
            <p className="text-2xl font-bold">{formatEGP(totalCommission)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {qualifyingSessions.length} qualifying session{qualifyingSessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/instructors/${id}?from=${prevFrom}&to=${prevTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          ← Prev
        </Link>
        <span className="font-medium text-sm">{monthLabel}</span>
        <Link
          href={`/instructors/${id}?from=${nextFrom}&to=${nextTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          Next →
        </Link>
      </div>

      {/* Sessions table */}
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No sessions found for this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Student(s)</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Session Price</th>
                <th className="px-3 py-2 text-right">Commission (25%)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const startsAt = new Date(s.startsAt);
                const endsAt = new Date(s.endsAt);
                const qualifies = s.bookings.some((b) =>
                  QUALIFYING_STATUSES.includes(b.status as LessonBookingStatus)
                );
                const price = LESSON_PRICES_EGP[s.lessonType as LessonType] ?? 0;
                const commission = price * COMMISSION_RATE;
                const bookingStatus = s.bookings[0]?.status ?? "—";
                const students = s.bookings
                  .map((b) => b.guest.name ?? b.guest.email)
                  .join(", ") || "—";

                return (
                  <tr key={s.id} className={`border-b ${!qualifies ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(startsAt, "dd MMM yyyy")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDuration(startsAt, endsAt)}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {s.lessonType.replace(/_/g, " ").toLowerCase()}
                    </td>
                    <td className="px-3 py-2">{students}</td>
                    <td className="px-3 py-2">
                      <span className="capitalize text-xs">
                        {bookingStatus.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {qualifies ? formatEGP(price) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                      {qualifies ? formatEGP(commission) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {qualifyingSessions.length > 0 && (
              <tfoot className="border-t bg-muted/20">
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-sm font-medium text-right">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium whitespace-nowrap">
                    {formatEGP(
                      qualifyingSessions.reduce(
                        (sum, s) => sum + (LESSON_PRICES_EGP[s.lessonType as LessonType] ?? 0),
                        0
                      )
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold whitespace-nowrap">
                    {formatEGP(totalCommission)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </main>
  );
}
