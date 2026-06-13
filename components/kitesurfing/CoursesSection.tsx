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

const accent = "#38bdf8";

type CourseCardProps = {
  index: string;
  tag: string;
  title: string;
  subtitle: string;
  duration: string;
  price: string;
  image: StaticImageData;
  dialogTitle?: string;
  dialogContent?: React.ReactNode;
  moreInfoHref?: string;
  priority?: boolean;
};

const ctaClass =
  "group inline-flex items-center gap-2 text-[0.65rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-opacity duration-200 hover:opacity-60";

function CourseCard({
  index,
  tag,
  title,
  subtitle,
  duration,
  price,
  image,
  dialogTitle,
  dialogContent,
  moreInfoHref,
  priority = false,
}: CourseCardProps) {
  return (
    <div className="group flex flex-col bg-[#f0f9ff] border-b border-r border-[#e0f2fe] last:border-r-0 odd:md:border-r even:md:border-r-0">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
        />
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Tag badge */}
        <span
          className="absolute top-4 left-4 text-[0.55rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[600] px-2.5 py-1"
          style={{ background: accent, color: "#0c1a2e" }}
        >
          {tag}
        </span>
      </div>

      {/* Info panel */}
      <div className="flex flex-col flex-1 gap-5 p-7 md:p-8">
        {/* Ghost index */}
        <span
          className="font-[family-name:var(--font-raleway)] font-[100] text-[3.8rem] leading-none select-none"
          style={{ color: "#bae6fd" }}
        >
          {index}
        </span>

        <div className="flex flex-col gap-2">
          <h3
            className="font-[family-name:var(--font-raleway)] text-[clamp(1.6rem,3vw,2.2rem)] font-[100] tracking-[-0.01em] leading-[0.9]"
            style={{ color: "#0c1a2e" }}
          >
            {title}
          </h3>
          <p
            className="text-[0.82rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[300]"
            style={{ color: "#64748b" }}
          >
            {subtitle}
          </p>
        </div>

        {/* Key facts: duration + price */}
        <div className="grid grid-cols-2 gap-x-6 border-t border-[#e0f2fe] pt-4 mt-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[0.55rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#94a3b8]">
              Duration
            </span>
            <span className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[500] text-[#0c1a2e]">
              {duration}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[0.55rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#94a3b8]">
              Price
            </span>
            <span className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[600] text-[#0c1a2e]">
              {price}
            </span>
          </div>
        </div>

        {/* CTA */}
        {moreInfoHref ? (
          <Link
            href={moreInfoHref}
            className={ctaClass}
            style={{ color: accent }}
          >
            Details & Pricing
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
        ) : (
          <Dialog>
            <DialogTrigger className={ctaClass} style={{ color: accent }}>
              Details & Pricing
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle
                  eyebrow="Kitesurfing · Fins Sokhna"
                  accent={accent}
                >
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

const BOOKING_HREF = "/kitesurfing/booking";

const bookBtn = (
  <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
    <Link
      href={BOOKING_HREF}
      className="inline-flex items-center gap-2 text-black text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 py-2.5 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-85"
      style={{ background: accent }}
    >
      Book now →
    </Link>
  </div>
);

const courses: CourseCardProps[] = [
  {
    index: "01",
    tag: "Level 1 & Level 2 IKO course",
    title: "Beginner Course",
    subtitle: "Learn to control the kite and get on the board",
    duration: "2–3 days",
    price: "From 22,000 EGP",
    image: beginnerPhoto,
    priority: true,
    moreInfoHref: "/kitesurfing/beginner-course",
  },
  {
    index: "02",
    tag: "2 hours",
    title: "Intro Session",
    subtitle: "One session to get a taste of kitesurfing",
    duration: "2 hours",
    price: "From 5,500 EGP",
    image: privateCourse,
    priority: true,
    moreInfoHref: "/kitesurfing/intro-course",
  },

  {
    index: "03",
    tag: "2 hours",
    title: "Refresher Course",
    subtitle: "Finished the beginner course? Polish your skills to ride solo",
    duration: "2 hours",
    price: "From 5,500 EGP",
    image: refresher,
    moreInfoHref: "/kitesurfing/refresher-course",
  },
  {
    index: "04",
    tag: "Ages 8+",
    title: "Kids Courses",
    subtitle: "Purpose-built courses for young riders, from age 8",
    duration: "From age 8",
    price: "15% off courses",
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
    <section id="courses" className="bg-white scroll-mt-16">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 pt-16 pb-12 md:pt-20 md:pb-14">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-7 flex-shrink-0 bg-[#38bdf8]" />
            <span className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#38bdf8]">
              IKO Certified · Sokhna Red Sea
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[100] tracking-[-0.02em] text-[#0c1a2e] leading-[0.9]">
                Learn to
              </span>
              <span
                className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[800] tracking-[-0.02em] leading-[0.9]"
                style={{ color: accent }}
              >
                kitesurf
              </span>
            </h2>
            <p className="text-[0.85rem] text-[#64748b] font-[family-name:var(--font-raleway)] font-[300] max-w-xs leading-relaxed">
              From your very first session to riding solo — choose the course that
              fits where you are right now.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Course grid */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[#e0f2fe]">
          {courses.map((course) => (
            <CourseCard key={course.title} {...course} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export default ContentSection;
