import { LessonType } from "@prisma/client";
import {
  createLessonSessionFromForm,
  getLessonFormUsers,
} from "@/lib/actions/lessons.actions";
import StudentSearchField from "@/components/lessons/StudentSearchField";

type Props = {
  searchParams: Promise<{ guestId?: string }>;
};

export default async function NewLessonPage({ searchParams }: Props) {
  const { guestId } = await searchParams;
  const { students, instructors } = await getLessonFormUsers();

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">New Lesson Session</h1>

      <form
        action={createLessonSessionFromForm}
        className="space-y-3 rounded-md border p-4"
      >
        <StudentSearchField students={students} initialStudentId={guestId} />

        <div>
          <label className="mb-1 block text-sm">Instructor</label>
          <select
            name="instructorId"
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="" disabled selected>
              Select instructor
            </option>
            {instructors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Start</label>
          <input
            type="datetime-local"
            name="startsAt"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm">Hours</label>
            <input
              type="number"
              name="durationHours"
              min={0}
              step={1}
              defaultValue={1}
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Minutes</label>
            <select
              name="durationMinutesPart"
              defaultValue="0"
              className="w-full rounded border px-3 py-2"
              required
            >
              <option value="0">00</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Lesson type</label>
          <select
            name="lessonType"
            defaultValue={LessonType.PRIVATE}
            className="w-full rounded border px-3 py-2"
          >
            {Object.values(LessonType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Notes</label>
          <textarea
            name="notes"
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Create lesson
        </button>
      </form>
    </main>
  );
}
