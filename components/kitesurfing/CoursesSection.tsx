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
import { KITESURFING_BOOKING_URL } from "@/lib/constants";

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
  "group inline-flex items-center gap-2 text-[0.72rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary transition-opacity duration-200 hover:opacity-70 cursor-pointer";

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
    <div className="group neu-raised flex flex-col rounded-[2rem] p-3">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="absolute top-4 left-4 rounded-full bg-neu-primary text-white text-[0.62rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] px-3 py-1.5">
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
              <span className="text-[0.62rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-muted">
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
    <Link
      href={KITESURFING_BOOKING_URL}
      className="neu-btn inline-flex items-center gap-2 rounded-xl bg-neu-primary text-white text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 py-2.5 font-[family-name:var(--font-raleway)]"
    >
      Book now <span aria-hidden="true">→</span>
    </Link>
  </div>
);

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
    dialogContent: (
      <div className="text-left space-y-4">
        <p className="text-sm text-white/55 font-[family-name:var(--font-raleway)] font-[300] leading-relaxed">
          Kids can start kitesurfing from the age of{" "}
          <strong className="text-white/80 font-[500]">8 years old</strong>.
        </p>
        <p className="text-sm text-white/55 font-[family-name:var(--font-raleway)] font-[300] leading-relaxed">
          We offer a{" "}
          <strong className="text-white/80 font-[500]">15% discount</strong>{" "}
          from the regular course price for young riders.
        </p>
        {bookBtn}
      </div>
    ),
  },
];

function ContentSection() {
  return (
    <section id="courses" className="bg-neu-base scroll-mt-40">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-16 pb-12 md:pt-20 md:pb-14">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.7rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary">
              IKO Certified · Sokhna Red Sea
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Learn to
              </span>
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[800] tracking-[-0.02em] leading-[0.95] text-neu-primary">
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
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {courses.map((course) => (
              <CourseCard key={course.title} {...course} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default ContentSection;
