import { LessonType } from "@prisma/client";
import {
  createLessonSessionFromForm,
  getLessonFormUsers,
} from "@/lib/actions/lessons.actions";
import StudentSearchField from "@/components/lessons/StudentSearchField";
import Link from "next/link";

const LESSON_TYPE_LABELS: Record<string, string> = {
  PRIVATE:       "Private",
  GROUP:         "Group",
  EXTRA_PRIVATE: "Extra Private",
  EXTRA_GROUP:   "Extra Group",
  FOIL:          "Foil",
  KIDS:          "Kids",
};

type Props = {
  searchParams: Promise<{ guestId?: string }>;
};

export default async function NewLessonPage({ searchParams }: Props) {
  const { guestId } = await searchParams;
  const { students, instructors } = await getLessonFormUsers();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f9ff 0%, #faf7f2 50%, #f0fdf4 100%)" }}>
      {/* Subtle wave decoration */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#38bdf8] via-[#7dd3fc] to-[#86efac] opacity-60" />

      <div className="mx-auto max-w-lg px-5 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/bookings/schedule"
            className="inline-flex items-center gap-1.5 text-[0.72rem] tracking-[0.08em] uppercase font-[600] text-[#94a3b8] hover:text-[#0ea5e9] transition-colors mb-6"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[0.6rem] tracking-[0.32em] uppercase font-[700] mb-2"
                style={{ color: "#38bdf8", fontFamily: "var(--font-raleway)" }}
              >
                Fins · Red Sea
              </p>
              <h1
                className="text-[2rem] font-[200] tracking-[-0.02em] leading-none"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              >
                New{" "}
                <span className="font-[700] text-[#0ea5e9]">Lesson</span>
              </h1>
            </div>
            <Link
              href="/students/new"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[0.68rem] font-[600] tracking-[0.06em] border transition-all hover:shadow-sm"
              style={{
                fontFamily: "var(--font-raleway)",
                borderColor: "#bae6fd",
                background: "#f0f9ff",
                color: "#0ea5e9",
              }}
            >
              + Student
            </Link>
          </div>
        </div>

        {/* Form card */}
        <form
          action={createLessonSessionFromForm}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 24px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(0,0,0,0.06)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
          }}
        >
          <div className="px-7 pt-7 pb-6 space-y-5">

            {/* Student */}
            <StudentSearchField students={students} initialStudentId={guestId} />

            {/* Instructor */}
            <FieldBlock label="Instructor">
              <select
                name="instructorId"
                required
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              >
                <option value="" disabled>Select instructor</option>
                {instructors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </FieldBlock>

            {/* Lesson type */}
            <FieldBlock label="Lesson type">
              <select
                name="lessonType"
                defaultValue={LessonType.PRIVATE}
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              >
                {Object.values(LessonType).map((t) => (
                  <option key={t} value={t}>
                    {LESSON_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </FieldBlock>

            {/* Start date/time */}
            <FieldBlock label="Starts at">
              <input
                type="datetime-local"
                name="startsAt"
                required
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              />
            </FieldBlock>

            {/* Duration */}
            <div>
              <p
                className="text-[0.55rem] tracking-[0.24em] uppercase font-[700] mb-2.5"
                style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
              >
                Duration
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FieldBlock label="Hours" compact>
                  <input
                    type="number"
                    name="durationHours"
                    min={0}
                    step={1}
                    defaultValue={1}
                    required
                    className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none"
                    style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                  />
                </FieldBlock>
                <FieldBlock label="Minutes" compact>
                  <select
                    name="durationMinutesPart"
                    defaultValue="0"
                    className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
                    style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                  >
                    <option value="0">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </FieldBlock>
              </div>
            </div>

            {/* Notes */}
            <FieldBlock label="Notes (optional)">
              <textarea
                name="notes"
                rows={3}
                placeholder="Any special requirements…"
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none resize-none placeholder:text-[#cbd5e1]"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              />
            </FieldBlock>

          </div>

          {/* Footer */}
          <div
            className="px-7 py-5"
            style={{
              borderTop: "1px solid rgba(186, 230, 253, 0.4)",
              background: "linear-gradient(to bottom, transparent, rgba(240,249,255,0.3))",
            }}
          >
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-[0.78rem] font-[700] tracking-[0.16em] uppercase transition-all duration-200 hover:shadow-md active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                color: "#fff",
                fontFamily: "var(--font-raleway)",
                boxShadow: "0 2px 12px rgba(14, 165, 233, 0.3)",
              }}
            >
              Create Lesson
            </button>
          </div>
        </form>

        {/* Decorative dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8 opacity-30">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? 6 : 4,
                height: i === 1 ? 6 : 4,
                background: "#38bdf8",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  children,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 transition-shadow focus-within:shadow-sm"
      style={{
        background: "#f8fbff",
        border: "1px solid rgba(186, 230, 253, 0.6)",
      }}
    >
      <p
        className={`${compact ? "text-[0.5rem]" : "text-[0.55rem]"} tracking-[0.22em] uppercase font-[700] mb-1.5`}
        style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
