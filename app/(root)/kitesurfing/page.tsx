import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Kitesurfing",
  description:
    "Learn to kitesurf at Fins — courses for all levels on the flat water near Sokhna.",
  image: "/images/hero_images/kitesurfing_desktop2.webp",
  path: "/kitesurfing",
});
import heroImage from "@/public/images/hero_images/kitesurfing_desktop2.webp";
import ContentSection from "@/components/kitesurfing/CoursesSection";
import KitesurfingRentalSection from "@/components/kitesurfing/KitesurfingRentalSection";
import MembershipSections from "@/components/kitesurfing/MembershipSections";
import Reveal from "@/components/kitesurfing/Reveal";
import SectionNav from "@/components/kitesurfing/SectionNav";
import SectionLink from "@/components/kitesurfing/SectionLink";
import GoodToKnow from "@/components/kitesurfing/GoodToKnow";
import AskOnWhatsApp from "@/components/kitesurfing/AskOnWhatsApp";
import BookCourseLink from "@/components/kitesurfing/BookCourseLink";

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
 * after opening a WhatsApp link, and it used to be five separately-delayed
 * reveal blocks stacked up to 0.3s, all starting from opacity 0 — so the
 * opening frame of a 22,000 EGP decision was an empty screen. Reveal now
 * refuses to animate anything on screen at load anyway; keeping the hero
 * unwrapped makes that a structural guarantee rather than a runtime check.
 */
function Hero() {
  return (
    <section className="bg-neu-base overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-28 md:pt-36 pb-14 md:pb-20 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.75rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
              IKO Certified Kite Centre · Sokhna · Red Sea
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-raleway)] leading-none mb-6">
            <span className="block text-[clamp(2.8rem,6vw,5.2rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
              Master the{" "}
            </span>
            <span className="block text-[clamp(2.8rem,6vw,5.2rem)] font-[800] tracking-[-0.02em] text-neu-primary-ink leading-[0.95]">
              Wind.
            </span>
          </h1>

          <p className="text-[0.95rem] md:text-[1.05rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-md leading-relaxed mb-10">
            Courses for every level, gear rental and storage, and beach access —
            everything you need to start kitesurfing or keep progressing, in one
            place.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <BookCourseLink className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-neu-primary text-neu-fg text-[0.75rem] font-[700] tracking-[0.12em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)] shadow-neu-sm">
              Book a course
            </BookCourseLink>
            <SectionLink
              id="courses"
              className="neu-btn neu-raised-sm inline-flex items-center gap-2 rounded-2xl text-neu-fg text-[0.75rem] font-[600] tracking-[0.12em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)]"
            >
              Explore courses
            </SectionLink>
          </div>
        </div>

        <div className="neu-raised rounded-[2rem] p-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
            <Image
              src={heroImage}
              alt="Kitesurfing on the Red Sea at Fins, Sokhna"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
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
