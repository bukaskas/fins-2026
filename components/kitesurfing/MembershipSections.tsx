import { FaWhatsapp } from "react-icons/fa";
import Reveal from "@/components/kitesurfing/Reveal";
import SectionHeader from "@/components/kitesurfing/SectionHeader";
import { centreWhatsAppHref } from "@/components/kitesurfing/AskOnWhatsApp";
import { KITER_DAY_PASS_CENTS } from "@/lib/kitesurfing-courses";

/**
 * Beach access for riders: a day pass and the two annual memberships.
 *
 * Every card used to end at "Reserve beach access" → /day-use/booking. That
 * form sells ordinary day use at a different price (1,100 EGP weekdays, see
 * lib/config/pricing.json), so the 800 EGP card sent riders to a checkout that
 * quoted them more, and the memberships sent people wanting a 25,000 EGP annual
 * plan to a single-day form. None of these has an online checkout, so each card
 * now opens WhatsApp with the offer already named.
 */

const tiers = [
  {
    name: "Day pass for kiters",
    price: (KITER_DAY_PASS_CENTS / 100).toLocaleString("en-US"),
    period: "per day",
    description:
      "For riders with their own kit. Full day access to the beach, lagoon, and facilities.",
    features: ["Lagoon swimming", "Sun loungers", "Facilities access"],
    action: "Ask about a day pass",
    message: "Hello, I would like to ask about a kiter day pass at Fins.",
    featured: false,
  },
  {
    name: "Family membership",
    price: "30,000",
    period: "per year",
    description: "2 adults and up to 2 children under 18.",
    features: ["Unlimited beach access", "Rental discounts", "Priority booking"],
    action: "Ask about family membership",
    message: "Hello, I would like to ask about the family membership at Fins.",
    featured: true,
  },
  {
    name: "Private membership",
    price: "25,000",
    period: "per year",
    description: "1 adult. Priority access and exclusive perks.",
    features: ["Unlimited beach access", "Rental discounts", "Priority booking"],
    action: "Ask about private membership",
    message: "Hello, I would like to ask about the private membership at Fins.",
    featured: false,
  },
];

function MembershipSections() {
  return (
    <section
      id="member"
      aria-labelledby="member-title"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-28">
        <Reveal>
          <SectionHeader id="member-title" title="Beach access and memberships">
            Both memberships include unlimited beach access, discounts on
            rentals, and priority booking.
          </SectionHeader>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(
            (
              {
                name,
                price,
                period,
                description,
                features,
                action,
                message,
                featured,
              },
              i
            ) => (
              <Reveal key={name} delay={i * 0.06} className="flex">
                <div
                  className={`flex flex-col flex-1 rounded-[2rem] p-8 transition-shadow duration-200 ${
                    featured
                      ? "bg-neu-primary text-neu-fg shadow-neu"
                      : "neu-raised-sm hover:shadow-neu"
                  }`}
                >
                  <h3 className="mb-6 font-[family-name:var(--font-raleway)] text-[1.125rem] font-[700] tracking-[-0.01em] text-neu-fg">
                    {name}
                  </h3>

                  <p className="mb-6">
                    <span className="font-[family-name:var(--font-raleway)] text-[2.6rem] font-[600] leading-none tracking-tight tabular-nums text-neu-fg">
                      {price}
                    </span>
                    <span
                      className={`ml-2 font-[family-name:var(--font-raleway)] text-[0.875rem] font-[500] ${
                        featured ? "text-neu-fg" : "text-neu-muted"
                      }`}
                    >
                      EGP {period}
                    </span>
                  </p>

                  <p
                    className={`mb-6 font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] leading-relaxed ${
                      featured ? "text-neu-fg" : "text-neu-muted"
                    }`}
                  >
                    {description}
                  </p>

                  <ul className="mb-8 flex flex-col gap-2">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 font-[family-name:var(--font-raleway)] text-[0.875rem] font-[400] text-neu-fg"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-[5px] w-[5px] flex-shrink-0 rounded-full ${
                            featured ? "bg-neu-fg" : "bg-neu-primary"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={centreWhatsAppHref(message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-auto inline-flex min-h-[44px] w-fit items-center gap-2 rounded-sm font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[600] underline underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neu-focus ${
                      featured
                        ? "text-neu-fg decoration-neu-fg/50 hover:decoration-neu-fg"
                        : "text-neu-primary-ink decoration-neu-primary-ink/40 hover:decoration-neu-primary-ink"
                    }`}
                  >
                    <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
                    {action}
                    <span className="sr-only">(opens WhatsApp)</span>
                  </a>
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
