"use client";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import privateCourse from "@/public/images/product-2.webp";
import beginnerPhoto from "@/public/images/webphotos_fins/webphoto_29.webp";
import refresher from "@/public/images/kitesurfing/refresher.webp";
import kidsCourse from "@/public/images/kitesurfing/kids_course.webp";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Reveal from "@/components/kitesurfing/Reveal";
import BookCourseLink from "@/components/kitesurfing/BookCourseLink";

const accent = "#0ea5e9";

type CourseCardProps = {
  index: string;
  tag: string;
  title: string;
  subtitle: string;
  facts: { label: string; value: string }[];
  image: StaticImageData;
  dialogTitle?: string;
  dialogContent?: React.ReactNode;
  moreInfoHref?: string;
};

const ctaClass =
  "group inline-flex items-center gap-2 text-[0.75rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink transition-opacity duration-200 hover:opacity-70 cursor-pointer";

function CourseCard({
  index,
  tag,
  title,
  subtitle,
  facts,
  image,
  dialogTitle,
  dialogContent,
  moreInfoHref,
}: CourseCardProps) {
  return (
    <div className="group neu-raised flex flex-1 flex-col rounded-[2rem] p-3">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="absolute top-4 left-4 rounded-full bg-neu-primary text-neu-fg text-[0.75rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] px-3 py-1.5">
          {tag}
        </span>
      </div>

      {/* Info panel */}
      <div className="flex flex-col flex-1 gap-4 p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-[family-name:var(--font-raleway)] text-[clamp(1.5rem,3vw,2rem)] font-[300] tracking-[-0.01em] leading-[0.95] text-neu-fg">
              {title}
            </h3>
            <p className="text-[0.85rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[400] text-neu-muted">
              {subtitle}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="font-[family-name:var(--font-raleway)] font-[200] text-[3rem] leading-none select-none text-neu-primary/25"
          >
            {index}
          </span>
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-2.5 mt-auto">
          {facts.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-xl bg-neu-inset/45 px-3.5 py-2.5"
            >
              <span className="text-[0.75rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
                {label}
              </span>
              <span className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {moreInfoHref ? (
          <Link href={moreInfoHref} className={ctaClass}>
            Details &amp; Pricing
            <span
              aria-hidden="true"
              className="group-hover:translate-x-1 transition-transform duration-200"
            >
              →
            </span>
          </Link>
        ) : (
          <Dialog>
            <DialogTrigger className={ctaClass}>
              Details &amp; Pricing
              <span
                aria-hidden="true"
                className="group-hover:translate-x-1 transition-transform duration-200"
              >
                →
              </span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle eyebrow="Kitesurfing · Fins Sokhna" accent={accent}>
                  {dialogTitle}
                </DialogTitle>
              </DialogHeader>
              <DialogBody>{dialogContent}</DialogBody>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

const bookBtn = (
  <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
    <BookCourseLink
      course="kids"
      className="neu-btn inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-neu-primary text-neu-fg text-[0.75rem] font-[700] tracking-[0.14em] uppercase px-5 font-[family-name:var(--font-raleway)]"
    >
      Book a course
    </BookCourseLink>
  </div>
);

/**
 * The Kids course specification.
 *
 * Replaces a modal titled "Details & Pricing" that carried neither: it said
 * only that kids start at 8 and get "15% off the regular course price", leaving
 * a parent to scroll back, find 22,000 EGP and do the arithmetic themselves.
 *
 * Rows with `value: null` are facts the centre has not established. They render
 * as visible slots in development and are dropped from a production build, so a
 * parent never sees a blank spec line. See GoodToKnow.tsx for the same pattern.
 *
 * Unlike GoodToKnow, this file is a client component, so its strings would ship
 * in the JS bundle even for rows that never render. The `needs` copy is
 * therefore built behind DEV, which folds to false in a production build and
 * lets the bundler drop the text entirely — internal notes about what the centre
 * has not decided should not be readable from a public bundle.
 *
 * The price is deliberately NOT derived from the adult price here.
 * lib/pricing.ts opens with the rule that nothing on the guest path may hardcode
 * or restate a price, because deriving one already produced a 750-vs-600 EGP
 * contradiction between the advert and the checkout, and a 1,600-vs-1,500 one on
 * holiday dates. A kids course price has to be stated once, by the centre, and
 * read from there.
 */
type Spec = {
  label: string;
  /** Confirmed answer, or an interim one where the product already states a
   *  rule. null means the row has nothing to show a guest yet. */
  value: string | null;
  /** What would make the row complete. Shown to the team in development, and
   *  present even on rows that already carry an interim `value`. */
  needs?: string;
};

/** Folded to `false` at build time, so anything behind it is eliminated. */
const DEV = process.env.NODE_ENV !== "production";

const kidsSpec: Spec[] = [
  // Established: stated on this card and in the page's QuickFacts block.
  { label: "Minimum age", value: "8 years" },
  {
    label: "Course",
    value: null,
    needs: DEV
      ? "Do kids take the standard Beginner Course, or a separate shorter one? The card says 'purpose-built courses', which implies a distinct course that is not described anywhere."
      : undefined,
  },
  {
    label: "Duration",
    value: null,
    needs: DEV
      ? "Hours per session and total course length for a young rider."
      : undefined,
  },
  {
    label: "Group size",
    value: null,
    needs: DEV
      ? "Adult groups are 2 to 4 students. Is it the same for kids, or smaller?"
      : undefined,
  },
  {
    // Interim: the rule the site already states today. Keeping it means the
    // production modal does not lose information while the figure is pending.
    label: "Price",
    value: "15% off the regular course price",
    needs: DEV
      ? "Replace with the kids course price as a stated figure — a parent should not have to find 22,000 EGP and work out 15% themselves. State it once; do not derive it in markup (see lib/pricing.ts on restated prices)."
      : undefined,
  },
];

function KidsCourseDetails() {
  const isDev = process.env.NODE_ENV !== "production";
  const rows = isDev ? kidsSpec : kidsSpec.filter((r) => r.value !== null);

  return (
    <div className="text-left">
      <dl className="flex flex-col gap-4">
        {rows.map(({ label, value, needs }) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
          >
            <dt className="text-[0.75rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-white/70">
              {label}
            </dt>
            {value ? (
              <dd className="flex flex-col gap-1.5 text-[0.95rem] font-[family-name:var(--font-raleway)] font-[500] text-white">
                {value}
                {isDev && needs && (
                  <span className="text-[0.85rem] font-[400] leading-relaxed text-white/70">
                    Still to confirm: {needs}
                  </span>
                )}
              </dd>
            ) : (
              <dd className="flex flex-col gap-1.5">
                <span className="inline-flex w-fit items-center rounded-full border border-dashed border-white/40 px-2.5 py-1 text-[0.75rem] font-[family-name:var(--font-raleway)] font-[600] uppercase tracking-[0.16em] text-white/80">
                  To confirm
                </span>
                <span className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[400] leading-relaxed text-white/70">
                  {needs}
                </span>
              </dd>
            )}
          </div>
        ))}
      </dl>
      {bookBtn}
    </div>
  );
}

const courses: CourseCardProps[] = [
  {
    index: "01",
    tag: "IKO Level 1 & 2",
    title: "Beginner Course",
    subtitle: "Learn to control the kite and get on the board",
    facts: [
      { label: "Duration", value: "2–3 days" },
      { label: "Price", value: "From 22,000 EGP" },
    ],
    image: beginnerPhoto,
    moreInfoHref: "/kitesurfing/beginner-course",
  },
  {
    index: "02",
    tag: "2 hours",
    title: "Intro Session",
    subtitle: "One session to get a taste of kitesurfing",
    facts: [
      { label: "Duration", value: "2 hours" },
      { label: "Price", value: "From 5,500 EGP" },
    ],
    image: privateCourse,
    moreInfoHref: "/kitesurfing/intro-course",
  },
  {
    index: "03",
    tag: "2 hours",
    title: "Refresher Course",
    subtitle: "Finished the beginner course? Polish your skills to ride solo",
    facts: [
      { label: "Duration", value: "2 hours" },
      { label: "Price", value: "From 5,500 EGP" },
    ],
    image: refresher,
    moreInfoHref: "/kitesurfing/refresher-course",
  },
  {
    index: "04",
    tag: "Ages 8+",
    title: "Kids Courses",
    subtitle: "Purpose-built courses for young riders, from age 8",
    facts: [
      { label: "Starting age", value: "8 years" },
      { label: "Price", value: "15% off courses" },
    ],
    image: kidsCourse,
    dialogTitle: "Kids Courses",
    dialogContent: <KidsCourseDetails />,
  },
];

function ContentSection() {
  return (
    <section
      id="courses"
      aria-label="Courses"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-16 pb-12 md:pt-20 md:pb-14">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.75rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
              IKO Certified · Sokhna Red Sea
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Learn to{" "}
              </span>
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[800] tracking-[-0.02em] leading-[0.95] text-neu-primary-ink">
                kitesurf
              </span>
            </h2>
            <p className="text-[0.85rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-xs leading-relaxed">
              From your very first session to riding solo — choose the course
              that fits where you are right now.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Course grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pb-8">
        {/* One motion rule across the page: a grid of cards arrives as a list,
            one card after another; everything else arrives as a single block.
            The membership tiers already staggered while this grid faded as one,
            so two card grids behaved differently. Stagger is capped at 0.18s
            total so the fourth card is never something the visitor waits for. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {courses.map((course, i) => (
            <Reveal key={course.title} delay={i * 0.06} className="flex">
              <CourseCard {...course} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentSection;
