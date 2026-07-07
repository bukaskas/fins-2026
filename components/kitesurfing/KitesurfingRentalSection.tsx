import Reveal from "@/components/kitesurfing/Reveal";

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
  "pb-3 text-[0.7rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary border-b border-[#8898aa]/25";

function KitesurfingRentalSection() {
  return (
    <section id="rental" className="bg-neu-base scroll-mt-40">
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 py-20 md:py-24">
        <Reveal>
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <span
              aria-hidden="true"
              className="h-px w-7 flex-shrink-0 bg-neu-primary"
            />
            <span className="text-[0.7rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary">
              Equipment
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[300] tracking-[-0.02em] text-neu-fg leading-[0.95]">
                Gear
              </span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] text-neu-primary leading-[0.95]">
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
          <div className="neu-inset rounded-3xl p-6 md:p-8 overflow-x-auto">
            <table className="w-full border-collapse min-w-[26rem]">
              <thead>
                <tr>
                  <th scope="col" className={`${thClass} text-left`}>
                    Item
                  </th>
                  <th scope="col" className={`${thClass} text-right w-24 md:w-28`}>
                    Half Day
                  </th>
                  <th scope="col" className={`${thClass} text-right w-24 md:w-28`}>
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
        </Reveal>
      </div>
    </section>
  );
}

export default KitesurfingRentalSection;
