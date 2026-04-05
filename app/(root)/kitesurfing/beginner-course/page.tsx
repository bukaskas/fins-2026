import Image from "next/image";
import Link from "next/link";

import beginnerPhoto from "@/public/images/webphotos_fins/webphoto_29.webp";
import { Button } from "@/components/ui/button";

function BeginnerCoursePage() {
  return (
    <main className="bg-stone-50 font-(family-name:--font-raleway) text-stone-900">
      <HeroSection />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.35fr_0.85fr] md:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              Beginner Kitesurfing Course
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              Build the skills to get your first rides.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-stone-700">
              The beginner course is aimed at helping students experience their
              first water starts. It is the best option for anyone who wants to
              get the feeling of getting on the board and starting their first
              rides with the support of an instructor.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="What you will learn"
              items={[
                "Kite setup, safety systems, and wind awareness",
                "Controlled flying and power management",
                "Body dragging in different directions",
                "Water relaunch and board recovery",
                "First board rides and water start practice",
              ]}
            />
            <InfoCard
              title="Who this course is for"
              items={[
                "First-time students with no previous experience",
                "Guests who want a structured multi-session program",
                "Riders who prefer close coaching before going solo",
                "Friends or couples who want to learn together in a group",
              ]}
            />
          </div>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-8">
            <h2 className="text-2xl font-semibold">How the course flows</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CourseStep
                step="01"
                title="Ground skills"
                description="Start with safety, equipment handling, and controlled kite flying on land."
              />
              <CourseStep
                step="02"
                title="Water control"
                description="Practice body dragging, relaunching the kite, and using kite power efficiently in the water."
              />
              <CourseStep
                step="03"
                title="First rides"
                description="Progress to board starts and short rides with direct instructor feedback."
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:sticky md:top-24 md:p-8">
          <h2 className="text-2xl font-semibold">Course details</h2>
          <div className="mt-6 space-y-5 text-stone-700">
            <DetailRow label="Private duration" value="6 hours" />
            <DetailRow label="Group duration" value="8 hours" />
            <DetailRow label="Course length" value="2 to 3 days" />
            <DetailRow label="Private price" value="22,000 EGP" />
            <DetailRow label="Group price" value="17,000 EGP per person" />
            <DetailRow label="Group size" value="2 to 4 students" />
          </div>

          <p className="mt-6 text-sm leading-7 text-stone-600">
            The exact pace depends on wind conditions and student progress. The
            goal is not to rush through the hours, but to build the right habits
            and confidence step by step.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="rounded-full text-base">
              <Link href="/kitesurfing/booking">Book beginner course</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full text-base"
            >
              <Link href="/kitesurfing">Back to kitesurfing</Link>
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default BeginnerCoursePage;

function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-stone-950">
      <Image
        src={beginnerPhoto}
        alt="Beginner kitesurfing lesson at Fins"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-12 pt-32 text-white md:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
          Learn from zero
        </p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Beginner Course
        </h2>
        <p className="max-w-2xl text-base leading-7 text-stone-200 md:text-lg">
          A structured first step into kitesurfing with focused coaching,
          safety-first progression, and enough water time to start riding.
        </p>
      </div>
    </section>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-5 space-y-3 text-stone-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 leading-7">
            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-stone-50 p-5 ring-1 ring-stone-200">
      <p className="text-sm font-semibold tracking-[0.3em] text-cyan-700">
        {step}
      </p>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-stone-700">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-semibold text-stone-900">{value}</span>
    </div>
  );
}
