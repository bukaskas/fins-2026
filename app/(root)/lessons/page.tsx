import { getAllLessons } from "@/lib/actions/lessons.actions";

function formatDuration(start: Date, end: Date) {
  const mins = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function LessonsPage() {
  const lessons = await getAllLessons();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Lessons</h1>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">Duration</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Instructor</th>
              <th className="px-3 py-2 text-left">Student(s)</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No lessons found.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => {
                const firstBooking = lesson.bookings[0];
                return (
                  <tr key={lesson.id} className="border-b">
                    <td className="px-3 py-2">
                      {new Date(lesson.startsAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {formatDuration(lesson.startsAt, lesson.endsAt)}
                    </td>
                    <td className="px-3 py-2">{lesson.lessonType}</td>
                    <td className="px-3 py-2">
                      {lesson.instructor?.name ||
                        lesson.instructor?.email ||
                        "—"}
                    </td>
                    <td className="px-3 py-2">
                      {lesson.bookings.length === 0
                        ? "—"
                        : lesson.bookings
                            .map((b) => b.guest.name || b.guest.email)
                            .join(", ")}
                    </td>
                    <td className="px-3 py-2">{firstBooking?.status ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
