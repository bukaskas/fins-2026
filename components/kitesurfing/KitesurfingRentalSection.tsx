"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const rentalItems = [
  { item: "Full equipment",          halfDay: "3,500",  fullDay: "5,200" },
  { item: "2 days full equipment",   halfDay: "6,000",  fullDay: "9,000" },
  { item: "Kite & bar",              halfDay: "3,000",  fullDay: "4,000" },
  { item: "Board only",              halfDay: "1,000",  fullDay: "1,700" },
  { item: "Bar only",                halfDay: "1,000",  fullDay: "1,700" },
  { item: "Wetsuit / Harness",       halfDay: "500",    fullDay: "600"   },
  { item: "Leash / Helmet",          halfDay: "250",    fullDay: "350"   },
];

function KitesurfingRentalSection() {
  useGSAP(() => {
    gsap.from("#rental", {
      scrollTrigger: {
        trigger: "#rental",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      opacity: 0,
      y: 40,
      duration: 4,
      ease: "power2.out",
    });
  });

  return (
    <section id="rental" style={{ background: "#f0f9ff" }}>
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-7 flex-shrink-0 bg-[#38bdf8]" />
          <span className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#38bdf8]">
            Equipment
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
          <h2 className="font-[family-name:var(--font-raleway)] leading-none">
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[100] tracking-[-0.02em] text-[#0c1a2e] leading-[0.9]">
              Gear
            </span>
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-[#38bdf8] leading-[0.9]">
              Rental
            </span>
          </h2>
          <p className="text-[0.82rem] text-[#64748b] font-[family-name:var(--font-raleway)] font-[300] max-w-xs leading-relaxed">
            Professional-grade gear, regularly maintained. Available for
            half-day (up to 4 hrs) or full-day (up to 8 hrs) hire.
          </p>
        </div>

        {/* Column headers */}
        <div
          className="grid gap-x-6 pb-3 mb-1"
          style={{
            gridTemplateColumns: "1fr 7rem 7rem",
            borderBottom: "1px solid #bae6fd",
          }}
        >
          <span className="text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-[#38bdf8]">
            Item
          </span>
          <span className="text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-right text-[#38bdf8]">
            Half Day
          </span>
          <span className="text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[500] text-right text-[#38bdf8]">
            Full Day
          </span>
        </div>

        {/* Price rows */}
        {rentalItems.map(({ item, halfDay, fullDay }) => (
          <div
            key={item}
            className="grid gap-x-6 py-4 transition-colors duration-150 hover:bg-sky-50/60"
            style={{
              gridTemplateColumns: "1fr 7rem 7rem",
              borderBottom: "1px solid #e0f2fe",
            }}
          >
            <span className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[300] text-[#1c1917]">
              {item}
            </span>
            <span className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-[#0c1a2e] text-right">
              {halfDay}
            </span>
            <span className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-[#0c1a2e] text-right">
              {fullDay}
            </span>
          </div>
        ))}

        <p className="text-[0.7rem] text-[#94a3b8] font-[family-name:var(--font-raleway)] font-[300] mt-5">
          All prices in EGP.
        </p>
      </div>
    </section>
  );
}

export default KitesurfingRentalSection;
