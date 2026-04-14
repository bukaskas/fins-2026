"use client";

import ContentSection from "@/components/kitesurfing/CoursesSection";
import KitesurfingRentalSection from "@/components/kitesurfing/KitesurfingRentalSection";
import MembershipSections from "@/components/kitesurfing/MembershipSections";

function KitesurfingPage() {
  return (
    <main>
      <NavigationMenu />
      <ContentSection />
      <KitesurfingRentalSection />
      <StorageTable />
      <MembershipSections />
    </main>
  );
}

export default KitesurfingPage;

/* ── Sticky anchor nav ───────────────────────────────────── */
function NavigationMenu() {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e0f2fe]">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20">
        <ul className="flex items-center gap-7 md:gap-12 py-3.5 overflow-x-auto">
          {[
            { label: "Courses",       href: "#courses" },
            { label: "Gear Rental",   href: "#rental"  },
            { label: "Storage",       href: "#storage" },
            { label: "Beach Access",  href: "#member"  },
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
      </div>
    </nav>
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
    <section id="storage" className="bg-white">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24">

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
      </div>
    </section>
  );
}
