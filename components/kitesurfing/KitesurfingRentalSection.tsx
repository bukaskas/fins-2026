import Reveal from "@/components/kitesurfing/Reveal";
import AskOnWhatsApp from "@/components/kitesurfing/AskOnWhatsApp";
import SectionHeader from "@/components/kitesurfing/SectionHeader";

/**
 * Gear rental and storage, as one section.
 *
 * These used to be two full-height sections with identical headers and
 * identical layouts, the second carrying only three rows. Both answer the same
 * guest ("what do I do about kit?") and end at the same WhatsApp conversation,
 * so they share one header and one action. Storage keeps its own `#storage`
 * anchor because the site footer links to it.
 */

const rentalItems = [
  { item: "Full equipment", halfDay: "4,000", fullDay: "5,700" },
  { item: "2 days full equipment", halfDay: "7,000", fullDay: "9,000" },
  { item: "Kite & bar", halfDay: "3,300", fullDay: "4,500" },
  { item: "Board only", halfDay: "1,200", fullDay: "1,700" },
  { item: "Bar only", halfDay: "1,200", fullDay: "1,700" },
  { item: "Wetsuit / Harness", halfDay: "500", fullDay: "600" },
  { item: "Leash / Helmet", halfDay: "250", fullDay: "350" },
];

const storageRates = [
  { duration: "One week", price: "500" },
  { duration: "One month", price: "1,200" },
  { duration: "Three months", price: "3,000" },
];

const thBase =
  "pb-3 text-[0.8125rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink border-b border-neu-line/25";

// `sticky` keeps the column labels with the numbers: 14 figures in two
// near-identical columns are unreadable once "Half day" and "Full day" have
// scrolled under the section nav. bg-neu-inset matches the well so rows pass
// behind it cleanly.
const stickyTh = `sticky top-[var(--sticky-stack)] z-10 bg-neu-inset pt-1 ${thBase}`;

const tdLabel =
  "py-4 pr-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[400] text-neu-fg";
const tdPrice =
  "py-4 text-right text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] tabular-nums text-neu-fg";
const tr = "border-b border-neu-line/15 last:border-b-0";

function KitesurfingRentalSection() {
  return (
    <section
      id="rental"
      aria-labelledby="rental-title"
      className="bg-neu-base scroll-mt-[var(--section-scroll-mt)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-24">
        <Reveal>
          <SectionHeader id="rental-title" title="Gear rental and storage">
            Rent maintained kit by the half day (up to 4 hours) or full day (up
            to 8 hours), or leave your own kit with us between sessions.
          </SectionHeader>
        </Reveal>

        <Reveal delay={0.1}>
          {/* The tables are reference data and read as one column; the
              section's action sits beside them on wide screens. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_1fr] lg:items-start lg:gap-14">
            {/* min-w-0: a grid item will not shrink below its content's
                min-content width by default, so the table's min-w-[22rem]
                would otherwise push the page wider than a 390px viewport. */}
            <div className="min-w-0 flex flex-col gap-10">
              <div className="neu-inset rounded-3xl p-6 md:p-8 overflow-x-auto md:overflow-x-visible">
                <table className="w-full border-collapse min-w-[22rem]">
                  <caption className="sr-only">
                    Gear rental prices in EGP
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={`${stickyTh} text-left`}>
                        Item
                      </th>
                      <th
                        scope="col"
                        className={`${stickyTh} text-right w-24 md:w-28`}
                      >
                        Half day
                      </th>
                      <th
                        scope="col"
                        className={`${stickyTh} text-right w-24 md:w-28`}
                      >
                        Full day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalItems.map(({ item, halfDay, fullDay }) => (
                      <tr key={item} className={tr}>
                        <th scope="row" className={`${tdLabel} text-left`}>
                          {item}
                        </th>
                        <td className={tdPrice}>{halfDay}</td>
                        <td className={tdPrice}>{fullDay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                id="storage"
                className="scroll-mt-[var(--section-scroll-mt)]"
              >
                <h3 className="font-[family-name:var(--font-raleway)] text-[1.25rem] font-[700] tracking-[-0.01em] text-neu-fg">
                  Storage for your own kit
                </h3>
                <p className="mt-2 max-w-md font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] leading-relaxed text-neu-muted">
                  Keep your gear on-site between sessions instead of carrying it
                  back and forth.
                </p>
                <div className="neu-inset mt-5 rounded-3xl p-6 md:p-8">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">
                      Equipment storage prices in EGP
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className={`${thBase} text-left`}>
                          Duration
                        </th>
                        <th
                          scope="col"
                          className={`${thBase} text-right w-24 md:w-28`}
                        >
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageRates.map(({ duration, price }) => (
                        <tr key={duration} className={tr}>
                          <th scope="row" className={`${tdLabel} text-left`}>
                            {duration}
                          </th>
                          <td className={tdPrice}>{price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="-mt-5 text-[0.8125rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400]">
                All prices in EGP.
              </p>
            </div>

            <div className="lg:sticky lg:top-[calc(var(--sticky-stack)+1.5rem)]">
              <AskOnWhatsApp
                label="Ask about gear or storage"
                message="Hello, I would like to ask about kitesurfing gear rental or storage at Fins."
              >
                Tell us your dates on WhatsApp and we will confirm what is
                available.
              </AskOnWhatsApp>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default KitesurfingRentalSection;
