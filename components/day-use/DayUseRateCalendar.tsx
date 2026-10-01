"use client";

import * as React from "react";
import type { DayButton } from "react-day-picker";
import { format } from "date-fns";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  RATE_LABELS,
  formatEGP,
  formatEGPAmount,
  resolveDayUseRate,
  type DayUseRate,
  type RateType,
} from "@/lib/pricing";
import {
  DAY_USE_BOOKING_HORIZON_MONTHS,
  type DateKey,
  addMonthsToKey,
  dateKeyFromLocalCalendar,
  localCalendarDateFromKey,
} from "@/lib/date-keys";

/* ─────────────────────────────────────────────────────────────
   Price-bearing month for /day-use/booking step 1. Every price
   shown comes from resolveDayUseRate — this component decides how
   a rate looks, never what it is. Colours and type follow
   .claude/design-system/pages/day-use.md.
   ───────────────────────────────────────────────────────────── */
const NAVY = "#0c1a2e";
const SKY = "#38bdf8";
const MUTED = "#54657a";
const HAIRLINE = "#dbe3ec";

// Saturated hue drives the dot and the tint; label text always uses the
// darkened pair so it clears 4.5:1. Regular uses the brand sky family — the
// rate is a Fins idea, not a status badge.
export const RATE_META: Record<
  RateType,
  { label: string; dot: string; bg: string; color: string }
> = {
  regular: { label: RATE_LABELS.regular, dot: "#0284c7", bg: "#f0f9ff", color: "#0369a1" },
  peak: { label: RATE_LABELS.peak, dot: "#f59e0b", bg: "#fffbeb", color: "#b45309" },
  "best-value": { label: RATE_LABELS["best-value"], dot: "#22c55e", bg: "#f0fdf4", color: "#15803d" },
};

const eyebrow =
  "font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.2em] uppercase font-[700]";

/** What the calendar shows for an event day (a SpecialEvent row). */
export type CalendarEvent = {
  title: string;
  shortLabel: string;
  description: string | null;
  href: string;
};

type DayState =
  | { kind: "open"; rate: DayUseRate }
  | { kind: "full" }
  | { kind: "unavailable" };

export function DayUseRateCalendar({
  selectedKey,
  onSelect,
  closedKeys,
  closedDatesLoading,
  closedDatesFailed,
  onRetryClosedDates,
  todayKey,
  eventsByKey,
}: {
  selectedKey: DateKey | null;
  onSelect: (key: DateKey) => void;
  closedKeys: ReadonlySet<DateKey>;
  closedDatesLoading: boolean;
  closedDatesFailed: boolean;
  onRetryClosedDates: () => void;
  /** Cairo today, fixed by the parent so every cell agrees on it. */
  todayKey: DateKey;
  /** Event days, marked with a star; choosing one hands off to its own form. */
  eventsByKey?: ReadonlyMap<DateKey, CalendarEvent>;
}) {
  // The same rolling window the server enforces (getDayUseBookingWindow),
  // anchored on the parent's `todayKey` so a page left open past midnight
  // doesn't disagree with itself.
  const firstKey = todayKey;
  const lastKey = addMonthsToKey(todayKey, DAY_USE_BOOKING_HORIZON_MONTHS);

  const firstDate = React.useMemo(() => localCalendarDateFromKey(firstKey), [firstKey]);
  const lastDate = React.useMemo(() => localCalendarDateFromKey(lastKey), [lastKey]);
  const selectedDate = selectedKey ? localCalendarDateFromKey(selectedKey) : undefined;

  const [month, setMonth] = React.useState<Date>(() => selectedDate ?? firstDate);

  const stateFor = React.useCallback(
    (key: DateKey): DayState => {
      if (key < firstKey || key > lastKey) return { kind: "unavailable" };
      if (closedKeys.has(key)) return { kind: "full" };
      return { kind: "open", rate: resolveDayUseRate(key) };
    },
    [firstKey, lastKey, closedKeys],
  );

  // A fresh component per render would remount every cell and lose focus, so
  // the button is memoised on what it reads.
  const RateDayButton = React.useMemo(
    () =>
      function RateDayButtonInner({
        day,
        modifiers,
        className,
        style,
        ...props
      }: React.ComponentProps<typeof DayButton>) {
        const ref = React.useRef<HTMLButtonElement>(null);
        React.useEffect(() => {
          if (modifiers.focused) ref.current?.focus();
        }, [modifiers.focused]);

        const key = dateKeyFromLocalCalendar(day.date);
        const state = stateFor(key);
        const selected = !!modifiers.selected;
        const isToday = key === todayKey;
        const meta = state.kind === "open" ? RATE_META[state.rate.rateType] : null;
        const event = state.kind === "open" ? eventsByKey?.get(key) : undefined;

        return (
          <button
            ref={ref}
            {...props}
            type="button"
            data-selected={selected || undefined}
            className={cn(
              "relative flex w-full min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 py-1.5",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed",
              state.kind === "open" && !selected && "hover:bg-[#f4f8fb]",
              className,
            )}
            style={{
              ...style,
              "--tw-ring-color": SKY,
              background: selected ? NAVY : undefined,
              borderColor: selected ? NAVY : isToday ? SKY : "transparent",
            } as React.CSSProperties}
          >
            {event && (
              <Star
                aria-hidden="true"
                className="absolute right-1 top-1 size-2.5"
                style={{ color: selected ? SKY : NAVY, fill: selected ? SKY : NAVY }}
              />
            )}
            <span
              className={cn(
                "font-[family-name:var(--font-raleway)] text-[0.9375rem] leading-none tabular-nums",
                selected ? "font-[700]" : "font-[600]",
              )}
              style={{
                color: selected ? "#ffffff" : state.kind === "open" ? NAVY : "#8a98aa",
              }}
            >
              {day.date.getDate()}
            </span>
            {state.kind === "open" && meta && (
              <span className="flex items-center gap-[3px] leading-none">
                <span
                  aria-hidden="true"
                  className="size-[5px] shrink-0 rounded-full"
                  style={{ background: selected ? SKY : meta.dot }}
                />
                <span
                  className="text-[0.8125rem] font-[600] tabular-nums tracking-[-0.02em]"
                  style={{ color: selected ? "#ffffff" : meta.color }}
                >
                  {formatEGPAmount(state.rate.adultUnitCents)}
                </span>
              </span>
            )}
            {state.kind === "full" && (
              <span
                className="text-[0.8125rem] font-[600] leading-none"
                style={{ color: MUTED }}
              >
                Full
              </span>
            )}
          </button>
        );
      },
    [stateFor, todayKey, eventsByKey],
  );

  return (
    <div>
      <div
        className="rounded-2xl border bg-white px-2 pb-3 pt-2 sm:px-3"
        style={{ borderColor: HAIRLINE }}
      >
        <p
          className="px-1 pb-1 pt-1 text-center text-[0.8125rem]"
          style={{ color: MUTED }}
        >
          Prices in EGP per adult
        </p>
        <Calendar
          mode="single"
          required
          selected={selectedDate}
          onSelect={(date) => date && onSelect(dateKeyFromLocalCalendar(date))}
          month={month}
          onMonthChange={setMonth}
          startMonth={firstDate}
          endMonth={lastDate}
          showOutsideDays={false}
          disabled={(date) => stateFor(dateKeyFromLocalCalendar(date)).kind !== "open"}
          labels={{
            labelDayButton: (date) => {
              const state = stateFor(dateKeyFromLocalCalendar(date));
              const day = format(date, "EEEE d MMMM");
              if (state.kind === "full") return `${day}, fully booked`;
              if (state.kind === "unavailable") return `${day}, not available`;
              const event = eventsByKey?.get(dateKeyFromLocalCalendar(date));
              return `${day}, ${formatEGP(state.rate.adultUnitCents)} per adult, ${RATE_LABELS[state.rate.rateType]} rate${event ? `, ${event.title} event day` : ""}`;
            },
            labelNext: () => "Next month",
            labelPrevious: () => "Previous month",
          }}
          components={{ DayButton: RateDayButton }}
          className="w-full bg-transparent p-0 [--cell-size:--spacing(11)]"
          classNames={{
            root: "w-full",
            month: "flex w-full flex-col gap-2",
            month_caption:
              "flex h-11 w-full items-center justify-center px-11",
            caption_label: cn(
              "font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[600] text-[#0c1a2e]",
            ),
            button_previous:
              "inline-flex size-11 items-center justify-center rounded-full text-[#0c1a2e] hover:bg-[#f4f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] aria-disabled:opacity-30 aria-disabled:pointer-events-none",
            button_next:
              "inline-flex size-11 items-center justify-center rounded-full text-[#0c1a2e] hover:bg-[#f4f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] aria-disabled:opacity-30 aria-disabled:pointer-events-none",
            weekday:
              "flex-1 select-none pb-1 text-center text-[0.8125rem] font-[600] text-[#54657a]",
            week: "mt-1 flex w-full gap-1",
            day: "flex-1 min-w-0 p-0 text-center select-none",
            today: "",
            selected: "",
            disabled: "",
            outside: "",
          }}
        />
      </div>

      {/* Legend: colour is supportive, so every hue is also named here, in
          each cell's accessible name and in the selected-date card. */}
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {(Object.keys(RATE_META) as RateType[]).map((type) => (
          <li
            key={type}
            className="flex items-center gap-1.5 text-[0.8125rem]"
            style={{ color: MUTED }}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: RATE_META[type].dot }}
            />
            {RATE_META[type].label}
          </li>
        ))}
        {eventsByKey && eventsByKey.size > 0 && (
          <li
            className="flex items-center gap-1.5 text-[0.8125rem]"
            style={{ color: MUTED }}
          >
            <Star
              aria-hidden="true"
              className="size-2.5"
              style={{ color: NAVY, fill: NAVY }}
            />
            Event day
          </li>
        )}
      </ul>

      {closedDatesLoading && !closedDatesFailed && (
        <p className="mt-3 text-center text-[0.8125rem]" style={{ color: MUTED }}>
          Checking which days are still open…
        </p>
      )}
      {closedDatesFailed && (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border px-4 py-3"
          style={{ borderColor: "#fde68a", background: "#fffbeb" }}
        >
          <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#b45309" }}>
            We couldn&apos;t check which days are full. You can still pick a
            date — we&apos;ll confirm it&apos;s open when you send your request.
          </p>
          <button
            type="button"
            onClick={onRetryClosedDates}
            disabled={closedDatesLoading}
            className="min-h-11 shrink-0 rounded-full border bg-white px-4 text-[0.8125rem] font-[600] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
            style={{ borderColor: "#fde68a", color: "#b45309", "--tw-ring-color": SKY } as React.CSSProperties}
          >
            {closedDatesLoading ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── The chosen day, spelled out: the cell is a glance, this is the quote. ── */
export function SelectedDayRateCard({ rate }: { rate: DayUseRate }) {
  const meta = RATE_META[rate.rateType];
  const date = localCalendarDateFromKey(rate.dateKey);
  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: HAIRLINE }}
      aria-live="polite"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ background: meta.bg }}
      >
        <span className="text-[0.9375rem] font-[600]" style={{ color: NAVY }}>
          {format(date, "EEEE d MMMM yyyy")}
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: meta.dot }}
          />
          <span className={eyebrow} style={{ color: meta.color }}>
            {meta.label} rate
          </span>
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: HAIRLINE }}>
        {[
          { label: "Adult", sub: null, cents: rate.adultUnitCents, unit: "adult" },
          { label: "Child", sub: "5–8 years", cents: rate.kidsUnitCents, unit: "child" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderColor: HAIRLINE }}
          >
            <span className="text-[0.875rem]" style={{ color: MUTED }}>
              {row.label}
              {row.sub && <span className="text-[0.8125rem]"> · {row.sub}</span>}
            </span>
            <span
              className="font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[700] tabular-nums"
              style={{ color: NAVY }}
            >
              {formatEGP(row.cents)} / {row.unit}
            </span>
          </div>
        ))}
      </div>
      <p
        className="border-t px-4 py-2.5 text-[0.8125rem]"
        style={{ color: MUTED, borderColor: HAIRLINE }}
      >
        Children under 5 join free — no ticket needed.
      </p>
    </div>
  );
}

/* ── An event day, chosen: the event has its own form, so this card says so
   and the step's primary action becomes the link to it (EventDayLink). ── */
export function SelectedDayEventCard({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="mt-4 rounded-2xl px-5 py-4"
      style={{ background: NAVY }}
      aria-live="polite"
    >
      <span className={cn(eyebrow, "flex items-center gap-2")} style={{ color: SKY }}>
        <Star aria-hidden="true" className="size-3" style={{ fill: SKY }} />
        Event day
      </span>
      <p
        className="mt-2 font-[family-name:var(--font-raleway)] text-[1.125rem] font-[700] leading-snug text-white"
      >
        {event.title}
      </p>
      {event.description && (
        <p className="mt-1 text-[0.875rem] leading-relaxed text-white/80">
          {event.description}
        </p>
      )}
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/70">
        This day is booked through the event page.
      </p>
    </div>
  );
}

/** Step 1's primary action on an event day: the way into the event's form. */
export function EventDayLink({ event }: { event: CalendarEvent }) {
  return (
    <Link
      href={event.href}
      className={cn(
        eyebrow,
        "flex w-full min-h-12 items-center justify-center gap-2 rounded-full px-6 text-center transition-opacity hover:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      )}
      style={{ background: SKY, color: NAVY, "--tw-ring-color": SKY } as React.CSSProperties}
    >
      Book the {event.title} day
      <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
}
