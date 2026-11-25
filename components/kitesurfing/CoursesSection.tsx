import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import privateCourse from "@/public/images/product-2.webp";
import beginnerPhoto from "@/public/images/webphotos_fins/webphoto_29.webp";
import refresher from "@/public/images/kitesurfing/refresher.webp";
import kidsCourse from "@/public/images/kitesurfing/kids_course.webp";
import Reveal from "@/components/kitesurfing/Reveal";
import SectionHeader from "@/components/kitesurfing/SectionHeader";
import { centreWhatsAppHref } from "@/components/kitesurfing/AskOnWhatsApp";
import { KITE_COURSES, formatCourseEGP } from "@/lib/kitesurfing-courses";

/**
 * The course grid on /kitesurfing.
 *
 * Each card answers "is this one for me?" in this order: who it is for (the
 * badge), what it is (title and one line), how long and how much (two facts),
 * and where to read more. The cards are not numbered: the courses are not a
 * sequence — Kids is not the step after Refresher.
 */

type CourseCardProps = {
  /** Who the course is for, in the guest's words. */
  audience: string;
  title: string;
  subtitle: string;
  facts: { label: string; value: string }[];
  image: StaticImageData;
  imageAlt: string;
  /** Internal detail page, or a WhatsApp chat for courses without one. */
  action:
    | { kind: "page"; href: string; label: string }
    | { kind: "whatsapp"; message: string; label: string };
};

const linkClass =
  "mt-1 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-sm font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[600] text-neu-primary-ink underline decoration-neu-primary-ink/40 underline-offset-[6px] transition-colors hover:decoration-neu-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neu-focus";

function CourseCard({
  audience,
  title,
  subtitle,
  facts,
  image,
  imageAlt,
  action,
}: CourseCardProps) {
  return (
    <article className="neu-raised flex flex-1 flex-col rounded-[2rem] p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="absolute top-4 left-4 rounded-full bg-neu-primary px-3 py-1.5 font-[family-name:var(--font-raleway)] text-[0.8125rem] font-[600] text-neu-fg">
          {audience}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-[family-name:var(--font-raleway)] text-[clamp(1.4rem,2.4vw,1.75rem)] font-[700] leading-[1.1] tracking-[-0.01em] text-neu-fg">
            {title}
          </h3>
          <p className="font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] leading-relaxed text-neu-muted">
            {subtitle}
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-2.5">
          {facts.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-xl bg-neu-inset/45 px-3.5 py-2.5"
            >
              <dt className="font-[family-name:var(--font-raleway)] text-[0.8125rem] font-[600] text-neu-primary-ink">
                {label}
              </dt>
              <dd className="font-[family-name:var(--font-raleway)] text-[0.9rem] font-[600] text-neu-fg">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {action.kind === "page" ? (
          <Link href={action.href} className={linkClass}>
            {action.label}
          </Link>
        ) : (
          <a
            href={centreWhatsAppHref(action.message)}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
            {action.label}
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
        )}
      </div>
    </article>
  );
}

const fromPrice = (cents: number) => `From ${formatCourseEGP(cents)}`;

/*
 * Kids courses have no detail page yet because the centre has not settled the
 * details, so the card opens WhatsApp instead. Still to confirm before a page
 * (or a fuller card) can exist:
 *   - Do kids take the standard Beginner Course, or a separate shorter one?
 *   - Hours per session and total course length for a young rider.
 *   - Group size: the same 2–4 as adults, or smaller?
 *   - The kids price as a stated figure, added to lib/kitesurfing-courses.ts,
 *     so a parent does not have to work out 15% off 22,000 EGP themselves.
 */
const courses: CourseCardProps[] = [
  {
    audience: "First time",
    title: KITE_COURSES.beginner.name,
    subtitle:
      "IKO levels 1 and 2: learn to control the kite and get on the board.",
    facts: [
      { label: "Duration", value: KITE_COURSES.beginner.length },
      {
        label: "Price",
        value: fromPrice(KITE_COURSES.beginner.groupPriceCents),
      },
    ],
    image: beginnerPhoto,
    imageAlt: "Beginner students with their kites laid out on the beach",
    action: {
      kind: "page",
      href: "/kitesurfing/beginner-course",
      label: "See the beginner course",
    },
  },
  {
    audience: "Trying it out",
    title: KITE_COURSES.intro.name,
    subtitle: "One session to get a taste of kitesurfing.",
    facts: [
      { label: "Duration", value: KITE_COURSES.intro.length },
      { label: "Price", value: fromPrice(KITE_COURSES.intro.groupPriceCents) },
    ],
    image: privateCourse,
    imageAlt: "An instructor showing a student how to handle the kite bar",
    action: {
      kind: "page",
      href: "/kitesurfing/intro-course",
      label: "See the intro session",
    },
  },
  {
    audience: "Done a course before",
    title: KITE_COURSES.refresher.name,
    subtitle: "Polish the skills from your last course and learn to ride solo.",
    facts: [
      { label: "Duration", value: KITE_COURSES.refresher.length },
      {
        label: "Price",
        value: fromPrice(KITE_COURSES.refresher.groupPriceCents),
      },
    ],
    image: refresher,
    imageAlt: "A rider practising on the board in shallow water",
    action: {
      kind: "page",
      href: "/kitesurfing/refresher-course",
      label: "See the refresher course",
    },
  },
  {
    audience: "Ages 8+",
    title: "Kids courses",
    subtitle: "Courses for young riders, from age 8.",
    facts: [
      { label: "Starting age", value: "8 years" },
      { label: "Price", value: "15% off courses" },
    ],
    image: kidsCourse,
    imageAlt: "A young rider kitesurfing in shallow turquoise water",
    action: {
      kind: "whatsapp",
      message: "Hello, I would like to ask about kids kitesurfing courses at Fins.",
      label: "Ask about kids courses",
    },
  },
];

function ContentSection() {
  return (
    <section
      id="courses"
      aria-labelledby="courses-title"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-20 md:pt-24">
        <Reveal>
          <SectionHeader id="courses-title" title="Choose a course">
            From your very first session to riding solo — choose the course
            that fits where you are right now.
          </SectionHeader>
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
