import Link from "next/link";
import Reveal from "@/components/kitesurfing/Reveal";

const tiers = [
  {
    name: "Beach Access",
    price: "800",
    period: "per day",
    description: "Full day access to the beach, lagoon, and facilities.",
    features: ["Lagoon swimming", "Sun loungers", "Facilities access"],
    featured: false,
  },
  {
    name: "Family Membership",
    price: "30,000",
    period: "per year",
    description: "2 adults and up to 2 children under 18.",
    features: ["Unlimited beach access", "Rental discounts", "Priority booking"],
    featured: true,
  },
  {
    name: "Private Membership",
    price: "25,000",
    period: "per year",
    description: "1 adult. Priority access and exclusive perks.",
    features: ["Unlimited beach access", "Rental discounts", "Priority booking"],
    featured: false,
  },
];

function MembershipSections() {
  return (
    <section id="member" className="bg-neu-base scroll-mt-40">
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-28">
        <Reveal>
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.7rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary">
              Beach Access
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Memberships &amp;
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-neu-primary leading-[0.95]">
                Beach Access
              </span>
            </h2>
            <p className="text-[0.85rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-xs leading-relaxed">
              Both memberships include unlimited beach access, discounts on
              rentals and storage, and priority booking.
            </p>
          </div>
        </Reveal>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(
            ({ name, price, period, description, features, featured }, i) => (
              <Reveal key={name} delay={i * 0.1} className="flex">
                <div
                  className={`flex flex-col flex-1 rounded-[2rem] p-8 transition-shadow duration-300 ${
                    featured
                      ? "bg-neu-primary text-white shadow-neu"
                      : "neu-raised-sm hover:shadow-neu"
                  }`}
                >
                  {/* Tier name */}
                  <p
                    className={`text-[0.7rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[600] mb-7 ${
                      featured ? "text-white/80" : "text-neu-muted"
                    }`}
                  >
                    {name}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span
                      className={`font-[family-name:var(--font-raleway)] text-[2.8rem] font-[300] leading-none tracking-tight ${
                        featured ? "text-white" : "text-neu-fg"
                      }`}
                    >
                      {price}
                    </span>
                    <span
                      className={`text-[0.75rem] tracking-wide font-[family-name:var(--font-raleway)] font-[400] ml-2 ${
                        featured ? "text-white/75" : "text-neu-muted"
                      }`}
                    >
                      EGP {period}
                    </span>
                  </div>

                  {/* Rule */}
                  <div
                    aria-hidden="true"
                    className={`h-px w-8 mb-5 ${
                      featured ? "bg-white/30" : "bg-[#8898aa]/30"
                    }`}
                  />

                  {/* Description */}
                  <p
                    className={`text-[0.85rem] font-[family-name:var(--font-raleway)] font-[400] leading-relaxed mb-6 ${
                      featured ? "text-white/85" : "text-neu-muted"
                    }`}
                  >
                    {description}
                  </p>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 mb-8">
                    {features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-center gap-2.5 text-[0.8rem] font-[family-name:var(--font-raleway)] font-[400] ${
                          featured ? "text-white/85" : "text-neu-fg"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${
                            featured ? "bg-white" : "bg-neu-primary"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-auto">
                    <Link
                      href="/day-use/booking"
                      className={`group inline-flex items-center gap-2 text-[0.72rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-opacity duration-200 hover:opacity-70 ${
                        featured ? "text-white" : "text-neu-primary"
                      }`}
                    >
                      Book now
                      <span
                        aria-hidden="true"
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default MembershipSections;
