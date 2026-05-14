import {
  getActiveLessonBundleProducts,
  getLessonFormUsers,
  getUserLessonHoursBalance,
} from "@/lib/actions/lessons.actions";
import NewLessonForm from "@/components/lessons/NewLessonForm";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ guestId?: string }>;
};

export default async function NewLessonPage({ searchParams }: Props) {
  const { guestId } = await searchParams;
  const [{ students, instructors }, bundleProducts, initialBalance] = await Promise.all([
    getLessonFormUsers(),
    getActiveLessonBundleProducts(),
    guestId ? getUserLessonHoursBalance(guestId) : Promise.resolve(null),
  ]);

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
        <NewLessonForm
          students={students}
          instructors={instructors}
          bundleProducts={bundleProducts}
          initialStudentId={guestId}
          initialBalance={initialBalance}
        />

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
