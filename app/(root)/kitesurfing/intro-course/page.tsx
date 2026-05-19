import Image from "next/image";
import Link from "next/link";

import introPhoto from "@/public/images/product-2.webp";
import { Button } from "@/components/ui/button";

function IntroCoursePage() {
  return (
    <main className="bg-stone-50 font-(family-name:--font-raleway) text-stone-900">
      <HeroSection />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.35fr_0.85fr] md:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              Intro Kitesurfing Session
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              Try kitesurfing in one focused session.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-stone-700">
              The intro course is designed for those planning to try kitesurfing
              for one session — to experience what we need to learn to become a
              kitesurfer. We focus on kite control, safety, and the basic
              knowledge required before getting on the board.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="What you will learn"
              items={[
                "How a kite works and how the wind powers it",
                "Safety systems, self-rescue basics, and wind awareness",
                "Controlled kite flying with the bar on land",
                "First feel of kite power and how to manage it",
                "What to expect if you decide to continue with a full course",
              ]}
            />
            <InfoCard
              title="Who this session is for"
              items={[
                "First-time visitors curious about kitesurfing",
                "Guests with limited time who want a taste before committing",
                "Travelers who want a guided introduction with an instructor",
                "Anyone who wants to know if kitesurfing is right for them",
              ]}
            />
          </div>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-8">
            <h2 className="text-2xl font-semibold">How the session flows</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CourseStep
                step="01"
                title="Theory & safety"
                description="A short briefing on how the kite works, the wind window, and safety systems before we touch the gear."
              />
              <CourseStep
                step="02"
                title="Kite control"
                description="Hands-on flying with a training kite, then progressing to a full-size kite under instructor guidance."
              />
              <CourseStep
                step="03"
                title="Next steps"
                description="A clear picture of where you are and what a full beginner course would add if you decide to continue."
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-200 md:sticky md:top-24 md:p-8">
          <h2 className="text-2xl font-semibold">Session details</h2>
          <div className="mt-6 space-y-5 text-stone-700">
            <DetailRow label="Duration" value="2 hours" />
            <DetailRow label="Format" value="One session" />
            <DetailRow label="Private price" value="8,500 EGP" />
            <DetailRow label="Group price" value="5,500 EGP per person" />
            <DetailRow label="Group size" value="2 to 4 students" />
          </div>

          <p className="mt-6 text-sm leading-7 text-stone-600">
            The intro session is not designed to get you riding the board — its
            goal is to give you the knowledge and feel needed to decide if you
            want to continue with a full beginner course.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="rounded-full text-base">
              <Link href="/kitesurfing/booking">Book intro session</Link>
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

export default IntroCoursePage;

function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-stone-950">
      <Image
        src={introPhoto}
        alt="Intro kitesurfing session at Fins"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-12 pt-32 text-white md:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
          Try it in one session
        </p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Intro Session
        </h2>
        <p className="max-w-2xl text-base leading-7 text-stone-200 md:text-lg">
          A focused two-hour introduction to kitesurfing — safety, kite control,
          and the knowledge you need before getting on the board.
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
