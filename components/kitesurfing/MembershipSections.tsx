"use client";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const accent = "#38bdf8";

const tiers = [
  {
    name:        "Beach Access",
    price:       "800",
    period:      "per day",
    description: "Full day access to the beach, lagoon, and facilities.",
    features:    ["Lagoon swimming", "Sun loungers", "Facilities access"],
    featured:    false,
  },
  {
    name:        "Family Membership",
    price:       "30,000",
    period:      "per year",
    description: "2 adults and up to 2 children under 18.",
    features:    ["Unlimited beach access", "Rental discounts", "Priority booking"],
    featured:    true,
  },
  {
    name:        "Private Membership",
    price:       "25,000",
    period:      "per year",
    description: "1 adult. Priority access and exclusive perks.",
    features:    ["Unlimited beach access", "Rental discounts", "Priority booking"],
    featured:    false,
  },
];

function MembershipSections() {
  useGSAP(() => {
    gsap.from("#member", {
      scrollTrigger: {
        trigger: "#member",
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
    <section id="member" style={{ background: "#0c1a2e" }}>
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-7 flex-shrink-0" style={{ background: accent }} />
          <span
            className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500]"
            style={{ color: accent }}
          >
            Beach Access
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
          <h2 className="font-[family-name:var(--font-raleway)] leading-none">
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[100] tracking-[-0.02em] text-white leading-[0.9]">
              Memberships &amp;
            </span>
            <span
              className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] leading-[0.9]"
              style={{ color: accent }}
            >
              Beach Access
            </span>
          </h2>
          <p className="text-[0.82rem] font-[family-name:var(--font-raleway)] font-[300] max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Both memberships include unlimited beach access, discounts on
            rentals and storage, and priority booking.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map(({ name, price, period, description, features, featured }) => (
            <div
              key={name}
              className="flex flex-col p-8 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: featured ? accent : "rgba(255,255,255,0.05)",
                border:     featured ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Tier name */}
              <p
                className="text-[0.58rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)] font-[500] mb-7"
                style={{ color: featured ? "#0c1a2e" : "rgba(255,255,255,0.35)" }}
              >
                {name}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span
                  className="font-[family-name:var(--font-raleway)] text-[2.8rem] font-[100] leading-none tracking-tight"
                  style={{ color: featured ? "#0c1a2e" : "white" }}
                >
                  {price}
                </span>
                <span
                  className="text-[0.7rem] tracking-wide font-[family-name:var(--font-raleway)] font-[300] ml-2"
                  style={{ color: featured ? "rgba(12,26,46,0.55)" : "rgba(255,255,255,0.3)" }}
                >
                  EGP {period}
                </span>
              </div>

              {/* Rule */}
              <div
                className="h-px w-8 mb-5"
                style={{ background: featured ? "rgba(12,26,46,0.2)" : "rgba(255,255,255,0.1)" }}
              />

              {/* Description */}
              <p
                className="text-[0.82rem] font-[family-name:var(--font-raleway)] font-[300] leading-relaxed mb-6"
                style={{ color: featured ? "#0c1a2e" : "rgba(255,255,255,0.45)" }}
              >
                {description}
              </p>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-8">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-[0.75rem] font-[family-name:var(--font-raleway)] font-[300]"
                    style={{ color: featured ? "#0c1a2e" : "rgba(255,255,255,0.4)" }}
                  >
                    <span
                      className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                      style={{ background: featured ? "#0c1a2e" : accent }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                <Link
                  href="/day-use/booking"
                  className="group inline-flex items-center gap-2 text-[0.62rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-opacity duration-200 hover:opacity-60"
                  style={{ color: featured ? "#0c1a2e" : accent }}
                >
                  Book now
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MembershipSections;
