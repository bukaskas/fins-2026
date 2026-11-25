import { KITE_SEASON, inKiteSeason } from "@/lib/kitesurfing-courses";

/**
 * The kite season as a twelve-month bar: the main season filled, the winter
 * months hatched because the centre says they "can be good too".
 *
 * The bar and month initials are drawn for sighted visitors and hidden from
 * assistive tech; the caption underneath carries the same fact as a sentence,
 * so nothing is only available as a picture.
 *
 * The fill sweeps in once on load (CSS only, see `.season-fill` in globals.css)
 * and is simply drawn when the visitor prefers reduced motion.
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function SeasonBar() {
  const first = MONTHS[KITE_SEASON.firstMonth - 1];
  const last = MONTHS[KITE_SEASON.lastMonth - 1];

  return (
    <figure className="w-full max-w-md">
      <div aria-hidden="true">
        <div className="relative grid h-3.5 grid-cols-12 rounded-full bg-neu-inset shadow-neu-inset-sm">
          {/* Off-season months: possible, not closed. */}
          <span
            className="rounded-l-full opacity-60 [background-image:repeating-linear-gradient(135deg,var(--color-neu-primary)_0_2px,transparent_2px_6px)]"
            style={{ gridColumn: `1 / ${KITE_SEASON.firstMonth}` }}
          />
          <span
            className="season-fill rounded-full bg-neu-primary"
            style={{
              gridColumn: `${KITE_SEASON.firstMonth} / ${KITE_SEASON.lastMonth + 1}`,
            }}
          />
        </div>

        <ol className="mt-2 grid grid-cols-12 text-center font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] tabular-nums">
          {MONTHS.map((month, i) => (
            <li
              key={month}
              className={
                inKiteSeason(i + 1) ? "text-neu-primary-ink" : "text-neu-muted"
              }
            >
              {month[0]}
            </li>
          ))}
        </ol>
      </div>

      <figcaption className="mt-3 font-[family-name:var(--font-raleway)] text-[0.875rem] font-[500] leading-relaxed text-neu-muted">
        <span className="text-neu-fg">
          Main season {first} to {last}.
        </span>{" "}
        Winter can be good too — ask us about the wind.
      </figcaption>
    </figure>
  );
}

export default SeasonBar;
