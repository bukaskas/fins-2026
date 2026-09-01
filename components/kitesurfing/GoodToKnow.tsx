import Reveal from "@/components/kitesurfing/Reveal";

/**
 * The practical questions a guest has before committing to a course, answered
 * in one place.
 *
 * Most of these answers do not exist anywhere in the product yet, so this
 * component is deliberately built around that. A fact with `detail: null` is one
 * the centre still has to confirm; `needs` states exactly what has to be
 * answered. Those rows render as visible slots in development and are dropped
 * entirely from a production build, so the page never ships an empty promise to
 * a guest and never shows them a note meant for the team. Fill a `detail` in and
 * the row goes live on the next deploy.
 *
 * Nothing here is invented. Every populated `detail` is quoted from language the
 * product already uses, cited at the fact.
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
    detail: null,
    needs:
      "The season starts in March and ends in December, but if you are staying in egypt we also get good conditions in winter. Contact us to check the wind before you come.",
  },
  {
    term: "What to bring",
    detail: null,
    needs:
      "Swimwear, sun protection and remember to check the wind.",
  },
  {
    term: "Swimming and fitness",
    detail: null,
    needs:
      "Swimming is required, notice the us if you feel uncomfortable, so we would plan the lessons in easier conditions",
  },
  {
    term: "Wetsuit and harness",
    detail: null,
    needs:
      "Kitesurfing lessons include all the gear needed for the lesson.",
  },
  {
    term: "If there is no wind",
    detail: null,
    needs:
      "In case of no wind we reschedule the lesson for another day with suitable conditions.",
  },
  {
    term: "Paying and holding your place",
    // Established product truth, not authored here: the 50% rule is computed in
    // lib/actions/booking.actions.ts:1221 (totalPriceCents / 2), and this is the
    // wording the guest booking page already shows at
    // app/(root)/bookings/[id]/NextStepCard.tsx:250.
    detail:
      "A 25% deposit confirms your booking. Your place is held for 24 hours to pay — after that the booking is released automatically. The deposit is non-refundable and can be moved to another date if noticed not less than 24hrs.",
  },
  {
    term: "Cancelling or changing a booking",
    detail: null,
    needs:
      "No cancellation is possible, but we accept reschedule if you notice 24 hrs before the booking date.",
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
      aria-label="Good to know"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-24">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.75rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
              Before you book
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Good to{" "}
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-neu-primary-ink leading-[0.95]">
                know
              </span>
            </h2>
            <p className="text-[0.85rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-xs leading-relaxed">
              The practical details — conditions, kit, and what happens to your
              booking once you pay.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="neu-inset rounded-3xl p-6 md:p-8">
            <dl className="grid gap-x-12 gap-y-7 md:grid-cols-2">
              {visible.map(({ term, detail, needs }) => (
                <div key={term} className="flex flex-col gap-2">
                  <dt className="text-[0.75rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
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
