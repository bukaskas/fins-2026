import Reveal from "@/components/kitesurfing/Reveal";
import SectionHeader from "@/components/kitesurfing/SectionHeader";

/**
 * The practical questions a guest has before committing to a course, answered
 * in one place.
 *
 * Answers come from the centre. A fact may still be added with `detail: null`
 * while the centre confirms it; `needs` then states what has to be answered.
 * Such rows render as visible slots in development and are dropped entirely
 * from a production build, so the page never ships an empty promise to a guest
 * and never shows them a note meant for the team.
 *
 * Kitesurfing is booked and paid on the school app (see lib/booking-url.ts),
 * not through this site's booking flow, so the deposit here is the school's
 * 25% — not the 50% day-use deposit in lib/bookings/payment-window.ts.
 */

type Fact = {
  term: string;
  /** Confirmed guest-facing answer, or null while it is still unknown. */
  detail: string | null;
  /** What the centre has to decide before this row can go live. */
  needs?: string;
};

const facts: Fact[] = [
  {
    term: "Wind season",
    detail:
      "The main season runs from March to December. Winter can be good too if you are already in Egypt — message us and we will tell you what the wind looks like before you come.",
  },
  {
    term: "What to bring",
    detail:
      "Swimwear and sun protection. Check the wind with us before you set off.",
  },
  {
    term: "Swimming and fitness",
    detail:
      "You need to be able to swim. If you are not confident in the water, tell us and we will plan your lessons for easier conditions.",
  },
  {
    term: "Wetsuit and harness",
    detail: "Included. Every lesson comes with all the gear you need.",
  },
  {
    term: "If there is no wind",
    detail:
      "We move your lesson to another day with suitable conditions.",
  },
  {
    term: "Paying and holding your place",
    detail:
      "A 25% deposit confirms your booking. The deposit is non-refundable, but you can move it to another date if you tell us at least 24 hours before your lesson.",
  },
  {
    term: "Cancelling or changing a booking",
    detail:
      "Bookings cannot be cancelled. You can reschedule if you tell us at least 24 hours before your booking date.",
  },
];

function PendingDetail({ needs }: { needs: string }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="inline-flex w-fit items-center rounded-full border border-dashed border-neu-primary-ink/50 px-2.5 py-1 text-[0.75rem] font-[family-name:var(--font-raleway)] font-[600] uppercase tracking-[0.16em] text-neu-primary-ink">
        To confirm
      </span>
      <span className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[400] leading-relaxed text-neu-muted">
        {needs}
      </span>
    </span>
  );
}

function GoodToKnow() {
  const isDev = process.env.NODE_ENV !== "production";
  // In production a fact without an answer is simply not shown.
  const visible = isDev ? facts : facts.filter((f) => f.detail !== null);
  if (visible.length === 0) return null;

  return (
    <section
      id="good-to-know"
      aria-labelledby="good-to-know-title"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-24">
        <Reveal>
          <SectionHeader id="good-to-know-title" title="Before you book">
            Conditions, kit, and what happens to your booking once you pay.
          </SectionHeader>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="neu-inset rounded-3xl p-6 md:p-8">
            <dl className="grid gap-x-12 gap-y-7 md:grid-cols-2">
              {visible.map(({ term, detail, needs }) => (
                <div key={term} className="flex flex-col gap-2">
                  <dt className="text-[0.9375rem] font-[family-name:var(--font-raleway)] font-[700] text-neu-fg">
                    {term}
                  </dt>
                  <dd className="text-[0.9rem] font-[family-name:var(--font-raleway)] font-[400] leading-relaxed text-neu-fg">
                    {detail ?? <PendingDetail needs={needs ?? ""} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default GoodToKnow;
