import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Kitesurfing",
  description:
    "Learn to kitesurf at Fins — courses for all levels on the flat water near Sokhna.",
  image: "/images/hero_images/kitesurfing_desktop2.webp",
  path: "/kitesurfing",
});
import heroImage from "@/public/images/webphotos_fins/webphoto_4.webp";
import ContentSection from "@/components/kitesurfing/CoursesSection";
import KitesurfingRentalSection from "@/components/kitesurfing/KitesurfingRentalSection";
import MembershipSections from "@/components/kitesurfing/MembershipSections";
import SectionNav from "@/components/kitesurfing/SectionNav";
import SectionLink from "@/components/kitesurfing/SectionLink";
import GoodToKnow from "@/components/kitesurfing/GoodToKnow";
import BookCourseLink from "@/components/kitesurfing/BookCourseLink";
import SeasonBar from "@/components/kitesurfing/SeasonBar";
import {
  GROUP_SIZE,
  KITE_COURSES,
  formatCourseEGP,
} from "@/lib/kitesurfing-courses";

function KitesurfingPage() {
  return (
    <main className="bg-neu-base">
      <Hero />
      <SectionNav />
      <ContentSection />
      <GoodToKnow />
      <KitesurfingRentalSection />
      <MembershipSections />
    </main>
  );
}

export default KitesurfingPage;

/* ── Hero ────────────────────────────────────────────────── */
/*
 * Deliberately not wrapped in Reveal. This is the first thing a guest sees
 * after opening a WhatsApp link, so nothing in it waits on JavaScript. The one
 * motion, the season fill, is CSS-only and draws over a visible track.
 *
 * The photo is the place itself, so it is not framed: on phones it leads the
 * screen at full width; from lg it bleeds off the right edge for the full
 * height of the hero. The figures come from lib/kitesurfing-courses.ts so the
 * hero can never quote a different price from the course cards.
 */
const beginner = KITE_COURSES.beginner;

function Hero() {
  return (
    <section
      aria-labelledby="kitesurfing-hero-title"
      className="relative bg-neu-base overflow-hidden"
    >
      <div className="relative h-[38svh] min-h-[15rem] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[44vw] lg:max-w-[46rem]">
        <Image
          src={heroImage}
          alt="A rider kitesurfing across flat turquoise water at Fins, Sokhna"
          fill
          priority
          placeholder="blur"
          className="object-cover object-[50%_52%] lg:rounded-bl-[4rem]"
          sizes="(min-width: 1024px) 44vw, 100vw"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-7 pb-14 md:pt-12 md:pb-16 lg:flex lg:min-h-[min(calc(100svh-var(--sticky-stack)),50rem)] lg:items-center lg:py-20">
        <div className="max-w-[34rem] lg:max-w-[calc(100%-44vw)] lg:pr-12 xl:max-w-[38rem]">
          <h1
            id="kitesurfing-hero-title"
            className="font-[family-name:var(--font-raleway)] text-[clamp(2.5rem,5vw,4.5rem)] font-[700] leading-[1.02] tracking-[-0.02em] text-neu-fg"
          >
            Learn to kitesurf on the flat water at Sokhna.
          </h1>

          <p className="mt-6 max-w-[34em] font-[family-name:var(--font-raleway)] text-[1.0625rem] font-[400] leading-[1.6] text-neu-fg">
            Beginner course in {beginner.length}, from{" "}
            <span className="whitespace-nowrap">
              {formatCourseEGP(beginner.groupPriceCents)}
            </span>
            . Groups of{" "}
            {GROUP_SIZE.min}–{GROUP_SIZE.max} with{" "}
            <span className="whitespace-nowrap">IKO-certified</span> instructors.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <BookCourseLink className="neu-btn inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-neu-primary px-6 font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[600] text-neu-fg shadow-neu-sm">
              Book a course
            </BookCourseLink>
            <SectionLink
              id="courses"
              className="inline-flex min-h-[44px] items-center rounded-sm font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[600] text-neu-primary-ink underline decoration-neu-primary-ink/40 underline-offset-[6px] transition-colors hover:decoration-neu-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neu-focus"
            >
              Compare courses
            </SectionLink>
          </div>

          <div className="mt-12">
            <SeasonBar />
          </div>
        </div>
      </div>
    </section>
  );
}
