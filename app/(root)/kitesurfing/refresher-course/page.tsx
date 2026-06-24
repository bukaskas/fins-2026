import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Refresher Kitesurfing Course",
  description:
    "Get back on the water with a refresher course at Fins near Sokhna.",
  image: "/images/kitesurfing/refresher.webp",
  path: "/kitesurfing/refresher-course",
});

import refresherPhoto from "@/public/images/kitesurfing/refresher.webp";
import { Button } from "@/components/ui/button";

function RefresherCoursePage() {
  return (
    <main className="bg-stone-50 font-(family-name:--font-raleway) text-stone-900">
      <HeroSection />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.35fr_0.85fr] md:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              Refresher Kitesurfing Course
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              Pick up where you left off and ride independently.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-stone-700">
              The refresher course is for riders who have already taken a course
              before. We refresh the last skills you worked on, then continue your
              progress toward the independent skills that let you ride on your
              own — like controlling your speed and riding upwind.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="What you will work on"
              items={[
                "Refresh the skills you covered in your last course",
                "Confident water starts in both directions",
                "Controlling your speed and managing kite power",
                "Riding upwind to stay in your starting area",
                "Building the independence to ride safely on your own",
              ]}
            />
            <InfoCard
              title="Who this course is for"
              items={[
                "Riders who completed a beginner course before",
                "Anyone returning after a break who wants to regain confidence",
                "Students close to riding independently who need final polish",
                "Kiters who want focused coaching on speed and upwind riding",
              ]}
            />
          </div>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-8">
            <h2 className="text-2xl font-semibold">How the course flows</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CourseStep
                step="01"
                title="Skill check"
                description="We assess your current level and refresh the last skills you worked on to get you back in the flow."
              />
              <CourseStep
                step="02"
                title="Speed & control"
                description="Practice managing kite power and controlling your speed so your rides become smooth and consistent."
              />
              <CourseStep
                step="03"
                title="Riding upwind"
                description="Work on riding upwind and the independent skills you need to ride safely on your own."
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:sticky md:top-24 md:p-8">
          <h2 className="text-2xl font-semibold">Course details</h2>
          <div className="mt-6 space-y-5 text-stone-700">
            <DetailRow label="Duration" value="2 hours" />
            <DetailRow label="Format" value="One session" />
            <DetailRow label="Private price" value="8,500 EGP" />
            <DetailRow label="Group price" value="5,500 EGP per person" />
            <DetailRow label="Group size" value="2 to 4 students" />
          </div>

          <p className="mt-6 text-sm leading-7 text-stone-600">
            We check your current skills and work on exactly what you need to
            ride safely and independently — the pace depends on wind conditions
            and where you are in your progression.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="rounded-full text-base">
              <Link href="/kitesurfing/booking">Book refresher course</Link>
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

export default RefresherCoursePage;

function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-stone-950">
      <Image
        src={refresherPhoto}
        alt="Refresher kitesurfing course at Fins"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-12 pt-32 text-white md:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
          Get back on the water
        </p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Refresher Course
        </h2>
        <p className="max-w-2xl text-base leading-7 text-stone-200 md:text-lg">
          Refresh the skills from your last course and keep progressing toward
          riding independently — controlling your speed and riding upwind.
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
