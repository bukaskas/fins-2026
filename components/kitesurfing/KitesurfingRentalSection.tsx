import Reveal from "@/components/kitesurfing/Reveal";
import AskOnWhatsApp from "@/components/kitesurfing/AskOnWhatsApp";

const rentalItems = [
  { item: "Full equipment", halfDay: "4,000", fullDay: "5,700" },
  { item: "2 days full equipment", halfDay: "7,000", fullDay: "9,000" },
  { item: "Kite & bar", halfDay: "3,300", fullDay: "4,500" },
  { item: "Board only", halfDay: "1,200", fullDay: "1,700" },
  { item: "Bar only", halfDay: "1,200", fullDay: "1,700" },
  { item: "Wetsuit / Harness", halfDay: "500", fullDay: "600" },
  { item: "Leash / Helmet", halfDay: "250", fullDay: "350" },
];

const thClass =
  // `sticky` keeps the column labels with the numbers: 14 figures in two
  // near-identical columns are unreadable once "Half Day" and "Full Day" have
  // scrolled under the section nav. bg-neu-inset matches the well so rows pass
  // behind it cleanly.
  "sticky top-[var(--sticky-stack)] z-10 bg-neu-inset pt-1 pb-3 text-[0.75rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink border-b border-[#8898aa]/25";

function KitesurfingRentalSection() {
  return (
    <section
      id="rental"
      aria-label="Gear rental"
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
              Equipment
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Gear{" "}
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-neu-primary-ink leading-[0.95]">
                Rental
              </span>
            </h2>
            <p className="text-[0.85rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] max-w-xs leading-relaxed">
              Professional-grade gear, regularly maintained. Available for
              half-day (up to 4 hrs) or full-day (up to 8 hrs) hire.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* The table is reference data and reads as one column; the section's
              action sits beside it on wide screens, echoing the header split
              above and closing the ~950px gap that opened between a row label
              and its price at full width. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_1fr] lg:items-start lg:gap-14">
            {/* min-w-0: a grid item will not shrink below its content's
                min-content width by default, so the table's min-w-[26rem] would
                otherwise push the whole page wider than a 390px viewport. */}
            <div className="min-w-0">
              <div className="neu-inset rounded-3xl p-6 md:p-8 overflow-x-auto md:overflow-x-visible">
                <table className="w-full border-collapse min-w-[26rem]">
                  <thead>
                    <tr>
                      <th scope="col" className={`${thClass} text-left`}>
                        Item
                      </th>
                      <th
                        scope="col"
                        className={`${thClass} text-right w-24 md:w-28`}
                      >
                        Half Day
                      </th>
                      <th
                        scope="col"
                        className={`${thClass} text-right w-24 md:w-28`}
                      >
                        Full Day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalItems.map(({ item, halfDay, fullDay }) => (
                      <tr
                        key={item}
                        className="border-b border-[#8898aa]/15 last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[400] text-neu-fg">
                          {item}
                        </td>
                        <td className="py-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg text-right">
                          {halfDay}
                        </td>
                        <td className="py-4 text-[0.9rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg text-right">
                          {fullDay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[0.75rem] text-neu-muted font-[family-name:var(--font-raleway)] font-[400] mt-5">
                All prices in EGP.
              </p>
            </div>

            <AskOnWhatsApp
              label="Ask about gear"
              message="Hello, I would like to ask about kitesurfing gear rental at Fins."
            >
              Tell us your dates on WhatsApp and we will confirm what is
              available.
            </AskOnWhatsApp>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default KitesurfingRentalSection;
