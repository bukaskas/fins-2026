import { Lock } from "lucide-react";

import type { CapacityLevel } from "@/lib/bookings/capacity";

type Props = {
  people: number;
  capacity: number;
  percent: number;
  level: CapacityLevel;
  label: string;
  /** False when the closed-dates read failed: show the count, claim nothing. */
  closedKnown: boolean;
  className?: string;
};

const FILL: Record<CapacityLevel, string> = {
  closed: "bg-[#b91c1c]",
  nearlyFull: "bg-[#b45309]",
  available: "bg-[#1a1614]",
};

/**
 * The day's capacity: adults + kids in confirmed or arrived bookings against
 * DAILY_CAPACITY. Same rules as the /reception capacity tiles
 * (`lib/bookings/capacity.ts`), drawn in this page's warm palette.
 */
export function CapacityBar({
  people,
  capacity,
  percent,
  level,
  label,
  closedKnown,
  className = "",
}: Props) {
  const showLevel = closedKnown || level === "nearlyFull";
  const over = people > capacity;

  return (
    <div className={`w-full max-w-[22rem] font-[family-name:var(--font-raleway)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.875rem] text-[#5b5650]">
          <span className="font-[family-name:var(--font-roboto)] text-[1.25rem] font-[600] tabular-nums text-[#1a1614]">
            {people}
          </span>
          <span className="font-[family-name:var(--font-roboto)] tabular-nums"> / {capacity}</span>{" "}
          guests{" "}
          <span className="text-[#6b6460]">(adults + kids)</span>
        </p>

        {showLevel && level === "closed" && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#fca5a5] bg-[#fef2f2] px-2.5 py-1 text-[0.72rem] font-[700] uppercase tracking-[0.12em] text-[#b91c1c]">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Closed
          </span>
        )}
        {showLevel && level === "nearlyFull" && (
          <span className="shrink-0 text-[0.72rem] font-[700] uppercase tracking-[0.12em] text-[#b45309]">
            Nearly full
          </span>
        )}
      </div>

      <div
        role="meter"
        aria-label={`Capacity: ${people} of ${capacity} guests${showLevel ? `, ${label.toLowerCase()}` : ""}`}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={Math.min(people, capacity)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ece8e3]"
      >
        <div
          className={`h-full rounded-full ${FILL[level]} transition-[width] duration-500 ease-out motion-reduce:transition-none`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-[0.75rem] text-[#6b6460]">
        Confirmed and arrived bookings
        {over && <span className="font-[600] text-[#b91c1c]"> · {people - capacity} over capacity</span>}
        {!closedKnown && <span> · couldn’t check if the day is closed</span>}
      </p>
    </div>
  );
}
