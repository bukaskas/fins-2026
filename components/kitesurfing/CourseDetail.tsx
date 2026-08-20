import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import Reveal from "@/components/kitesurfing/Reveal";
import { KITESURFING_BOOKING_URL } from "@/lib/constants";

/**
 * Shared building blocks for the course detail pages
 * (beginner / intro / refresher), styled to match the
 * kitesurfing page — see .claude/design-system/MASTER.md.
 */

export function CourseHero({
  eyebrow,
  titleLight,
  titleBold,
  description,
  image,
  imageAlt,
}: {
  eyebrow: string;
  titleLight: string;
  titleBold: string;
  description: string;
  image: StaticImageData;
  imageAlt: string;
}) {
  return (
    <section className="bg-neu-base overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-16 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
        <div>
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <span
                aria-hidden="true"
                className="h-px w-7 flex-shrink-0 bg-neu-primary"
              />
              <span className="text-[0.7rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary">
                {eyebrow}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-[family-name:var(--font-raleway)] leading-none mb-6">
              <span className="block text-[clamp(2.6rem,5.5vw,4.8rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                {titleLight}
              </span>
              <span className="block text-[clamp(2.6rem,5.5vw,4.8rem)] font-[800] tracking-[-0.02em] text-neu-primary leading-[0.95]">
                {titleBold}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-[0.95rem] md:text-[1.05rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-md leading-relaxed">
              {description}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="neu-raised rounded-[2rem] p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
              <Image
                src={image}
                alt={imageAlt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function CourseIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[0.7rem] font-[600] uppercase tracking-[0.3em] text-neu-primary">
        {eyebrow}
      </p>
      <h2 className="max-w-3xl text-3xl md:text-4xl font-[600] leading-tight tracking-[-0.01em] text-neu-fg">
        {title}
      </h2>
      <p className="max-w-3xl text-base md:text-lg leading-8 text-neu-muted font-[400]">
        {description}
      </p>
    </div>
  );
}

export function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="neu-raised-sm rounded-3xl p-6 md:p-7">
      <h2 className="text-xl md:text-2xl font-[600] text-neu-fg">{title}</h2>
      <ul className="mt-5 space-y-3 text-neu-muted">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 leading-7">
            <span
              aria-hidden="true"
              className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-neu-primary"
            />
            <span className="text-[0.95rem] font-[400]">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CourseFlow({
  title,
  steps,
}: {
  title: string;
  steps: { step: string; title: string; description: string }[];
}) {
  return (
    <section className="neu-raised-sm rounded-3xl p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-[600] text-neu-fg">{title}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(({ step, title: stepTitle, description }) => (
          <div key={step} className="rounded-2xl bg-neu-inset/45 p-5">
            <p className="text-[0.75rem] font-[600] tracking-[0.3em] text-neu-primary">
              {step}
            </p>
            <h3 className="mt-3 text-lg font-[600] text-neu-fg">{stepTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-neu-muted font-[400]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CourseAside({
  title,
  rows,
  note,
  bookLabel,
}: {
  title: string;
  rows: { label: string; value: string }[];
  note: string;
  bookLabel: string;
}) {
  return (
    <aside className="h-fit neu-raised rounded-3xl p-6 md:sticky md:top-32 md:p-8">
      <h2 className="text-xl md:text-2xl font-[600] text-neu-fg">{title}</h2>
      <div className="mt-6 space-y-5">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-[#8898aa]/20 pb-3 text-sm"
          >
            <span className="text-neu-muted font-[400]">{label}</span>
            <span className="text-right font-[600] text-neu-fg">{value}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm leading-7 text-neu-muted font-[400]">{note}</p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={KITESURFING_BOOKING_URL}
          className="neu-btn inline-flex items-center justify-center rounded-2xl bg-neu-primary text-white text-[0.8rem] font-[700] tracking-[0.1em] uppercase px-6 py-3.5 shadow-neu-sm"
        >
          {bookLabel}
        </Link>
        <Link
          href="/kitesurfing"
          className="neu-btn neu-raised-sm inline-flex items-center justify-center rounded-2xl text-neu-fg text-[0.8rem] font-[600] tracking-[0.1em] uppercase px-6 py-3.5"
        >
          Back to kitesurfing
        </Link>
      </div>
    </aside>
  );
}

export function CourseLayout({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.35fr_0.85fr] md:px-6 lg:px-8">
      <div className="space-y-8">{children}</div>
      {aside}
    </section>
  );
}
