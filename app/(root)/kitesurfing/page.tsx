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
import Reveal from "@/components/kitesurfing/Reveal";
import SectionNav from "@/components/kitesurfing/SectionNav";
import SectionLink from "@/components/kitesurfing/SectionLink";
import GoodToKnow from "@/components/kitesurfing/GoodToKnow";
import AskOnWhatsApp from "@/components/kitesurfing/AskOnWhatsApp";
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
      <QuickFacts />
      <ContentSection />
      <GoodToKnow />
      <KitesurfingRentalSection />
      <StorageTable />
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

/* ── Quick facts for first-time guests ───────────────────── */
const facts = [
  {
    title: "IKO certified",
    text: "Internationally certified instructors following the IKO progression.",
  },
  {
    title: "Small groups",
    text: "2–4 students per group lesson — or go private for one-on-one coaching.",
  },
  {
    title: "Kids from age 8",
    text: "Purpose-built kids courses with 15% off the regular course price.",
  },
  {
    title: "Gear sorted",
    text: "Rent full equipment on the spot, or store your own kit on-site.",
  },
];

function QuickFacts() {
  return (
    <section className="bg-neu-base">
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-14 md:py-16">
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {facts.map(({ title, text }) => (
              <div
                key={title}
                className="neu-raised-sm flex flex-col gap-3 rounded-3xl p-6"
              >
                <span aria-hidden="true" className="h-px w-7 bg-neu-primary" />
                <p className="text-[0.95rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[-0.01em] text-neu-fg">
                  {title}
                </p>
                <p className="text-[0.82rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Equipment Storage ───────────────────────────────────── */
const storageRates = [
  { duration: "One week", price: "500 EGP" },
  { duration: "One month", price: "1,200 EGP" },
  { duration: "Three months", price: "3,000 EGP" },
];

function StorageTable() {
  return (
    <section
      id="storage"
      aria-label="Equipment storage"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-24">
        <Reveal>
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.75rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
              On-site
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Equipment{" "}
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-neu-primary-ink leading-[0.95]">
                Storage
              </span>
            </h2>
            <p className="text-[0.85rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-xs">
              Store your kite gear safely on-site between sessions — no need to
              haul it back and forth.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Same structure as Gear Rental: the rates read as one column with
              the section's action beside them, rather than a two-item row
              stretched across the full 7xl container. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_1fr] lg:items-start lg:gap-14">
            <div className="min-w-0 neu-inset rounded-3xl p-6 md:p-8 overflow-x-auto md:overflow-x-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="text-left pb-3 text-[0.75rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink border-b border-[#8898aa]/25"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="text-right pb-3 text-[0.75rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink border-b border-[#8898aa]/25"
                    >
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {storageRates.map(({ duration, price }) => (
                    <tr
                      key={duration}
                      className="border-b border-[#8898aa]/15 last:border-b-0"
                    >
                      <td className="py-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[400] text-neu-fg">
                        {duration}
                      </td>
                      <td className="py-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg text-right">
                        {price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AskOnWhatsApp
              label="Ask about storage"
              message="Hello, I would like to ask about equipment storage at Fins."
            >
              Message us on WhatsApp to arrange storage for your kit.
            </AskOnWhatsApp>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
