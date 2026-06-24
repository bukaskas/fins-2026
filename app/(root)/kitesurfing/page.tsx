import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";

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

function KitesurfingPage() {
  return (
    <main>
      <Hero />
      <NavigationMenu />
      <QuickFacts />
      <ContentSection />
      <KitesurfingRentalSection />
      <StorageTable />
      <MembershipSections />
    </main>
  );
}

export default KitesurfingPage;

/* ── Hero ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative flex min-h-[72vh] md:min-h-[82vh] items-end overflow-hidden bg-[#0c1a2e]">
      <Image
        src={heroImage}
        alt="Kitesurfing on the Red Sea at Fins, Sokhna"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* Legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a2e]/85 via-[#0c1a2e]/25 to-transparent" />

      <div className="relative w-full max-w-7xl mx-auto px-8 md:px-14 lg:px-20 pb-16 md:pb-24 pt-40">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-7 flex-shrink-0 bg-[#38bdf8]" />
            <span className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#7dd3fc]">
              IKO Certified Kite Centre · Sokhna · Red Sea
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="font-[family-name:var(--font-raleway)] leading-none mb-6">
            <span className="block text-[clamp(2.8rem,7vw,6rem)] font-[100] tracking-[-0.02em] text-white leading-[0.92]">
              Master the
            </span>
            <span className="block text-[clamp(2.8rem,7vw,6rem)] font-[800] tracking-[-0.02em] text-[#38bdf8] leading-[0.92]">
              Wind.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-[0.95rem] md:text-[1.05rem] text-white/70 font-[family-name:var(--font-raleway)] font-[300] max-w-md leading-relaxed mb-10">
            Courses for every level, gear rental and storage, and beach access —
            everything you need to start kitesurfing or keep progressing, in one
            place.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/kitesurfing/booking"
              className="inline-flex items-center gap-2 rounded-full bg-[#38bdf8] text-[#0c1a2e] text-[0.7rem] font-[700] tracking-[0.14em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-85"
            >
              Book a session →
            </Link>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white text-[0.7rem] font-[600] tracking-[0.14em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)] transition-colors duration-200 hover:border-white/70"
            >
              Explore courses
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Sticky anchor nav ───────────────────────────────────── */
function NavigationMenu() {
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e0f2fe]">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 flex items-center justify-between gap-6 py-3">
        <span className="hidden md:block text-[0.85rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[-0.01em] text-[#0c1a2e]">
          Kitesurfing
        </span>

        <ul className="flex items-center gap-7 md:gap-10 overflow-x-auto">
          {[
            { label: "Courses",      href: "#courses" },
            { label: "Gear Rental",  href: "#rental"  },
            { label: "Storage",      href: "#storage" },
            { label: "Beach Access", href: "#member"  },
          ].map(({ label, href }) => (
            <li key={href} className="flex-shrink-0">
              <a
                href={href}
                className="group flex flex-col gap-0.5 text-[0.6rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-gray-500 hover:text-[#0ea5e9] transition-colors duration-200"
              >
                {label}
                <span className="h-px w-0 bg-[#38bdf8] group-hover:w-full transition-all duration-300 ease-out" />
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/kitesurfing/booking"
          className="flex-shrink-0 rounded-full bg-[#0c1a2e] text-white text-[0.6rem] font-[600] tracking-[0.18em] uppercase px-5 py-2 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-80"
        >
          Book
        </Link>
      </div>
    </nav>
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
    <section className="bg-white border-b border-[#e0f2fe]">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-14 md:py-16">
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            {facts.map(({ title, text }) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="h-px w-7 bg-[#38bdf8]" />
                <h3 className="text-[0.95rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[-0.01em] text-[#0c1a2e]">
                  {title}
                </h3>
                <p className="text-[0.8rem] text-[#64748b] font-[family-name:var(--font-raleway)] font-[300] leading-relaxed">
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
  { duration: "One week",      price: "500 EGP"   },
  { duration: "One month",     price: "1,200 EGP" },
  { duration: "Three months",  price: "3,000 EGP" },
];

function StorageTable() {
  return (
    <section id="storage" className="bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24">

        <Reveal>
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-7 flex-shrink-0 bg-[#38bdf8]" />
            <span className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#38bdf8]">
              On-site
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[100] tracking-[-0.02em] text-[#0c1a2e] leading-[0.9]">
                Equipment
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-[#38bdf8] leading-[0.9]">
                Storage
              </span>
            </h2>
            <p className="text-[0.82rem] text-[#64748b] font-[family-name:var(--font-raleway)] font-[300] max-w-xs">
              Store your kite gear safely on-site between sessions — no need to haul it back and forth.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Column headers */}
          <div
            className="grid grid-cols-[1fr_auto] gap-x-10 pb-3 mb-1"
            style={{ borderBottom: "1px solid #bae6fd" }}
          >
            <span className="text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#38bdf8]">
              Duration
            </span>
            <span className="text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-right w-28 text-[#38bdf8]">
              Price
            </span>
          </div>

          {storageRates.map(({ duration, price }) => (
            <div
              key={duration}
              className="grid grid-cols-[1fr_auto] gap-x-10 py-4"
              style={{ borderBottom: "1px solid #e0f2fe" }}
            >
              <span className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[300] text-[#1c1917]">
                {duration}
              </span>
              <span className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-[#0c1a2e] text-right w-28">
                {price}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
