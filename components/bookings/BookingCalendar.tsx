"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DayButton } from "react-day-picker";
import {
  visibleSlices,
  type CalendarFilter,
  type DayCount,
} from "@/lib/bookings/calendar-counts";

/** Parse a "yyyy-MM" key as the first of that month, local time. */
function monthFromKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function BookingCalendar({
  counts,
  closedDates = [],
  filter,
  month,
  firstMonth,
  lastMonth,
}: {
  counts: DayCount[];
  closedDates?: string[]; // YYYY-MM-DD strings
  filter: CalendarFilter;
  /** Visible month as "yyyy-MM". The URL owns it so the page stats follow it. */
  month: string;
  /** Range the counts cover, as "yyyy-MM"; navigation stops at these. */
  firstMonth: string;
  lastMonth: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const countMap = React.useMemo(
    () => new Map(counts.map((c) => [c.date, c])),
    [counts],
  );

  const closedSet = React.useMemo(() => new Set(closedDates), [closedDates]);
  const slices = React.useMemo(() => visibleSlices(filter), [filter]);

  const changeMonth = (next: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(next, "yyyy-MM"));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const CustomDayButton = React.useMemo(
    () =>
      function CustomDayButtonInner({
        day,
        modifiers,
        children,
        ...props
      }: React.ComponentProps<typeof DayButton>) {
        const dateKey = format(day.date, "yyyy-MM-dd");
        const data = countMap.get(dateKey);
        const isClosed = closedSet.has(dateKey);
        const shown = data
          ? slices
              .map((s) => ({ ...s, n: s.people(data) }))
              .filter((s) => s.n > 0)
          : [];
        const summary = shown.map((s) => `${s.n} ${s.meaning}`).join(", ");
        return (
          <CalendarDayButton
            day={day}
            modifiers={modifiers}
            {...props}
            aria-label={[
              format(day.date, "EEEE d MMMM"),
              isClosed ? "closed" : summary || "no bookings",
            ].join(", ")}
          >
            <span className={cn(isClosed && "line-through opacity-40")}>{children}</span>
            {isClosed ? (
              <span className="text-xs font-semibold leading-none text-red-700 dark:text-red-400 !opacity-100">
                closed
              </span>
            ) : shown.length > 0 ? (
              <span className="flex items-baseline gap-1 text-xs font-bold leading-none tabular-nums tracking-tight !opacity-100">
                {shown.map((s) => (
                  <span key={s.value} style={{ color: s.color }}>
                    {s.n}
                  </span>
                ))}
              </span>
            ) : null}
          </CalendarDayButton>
        );
      },
    [countMap, closedSet, slices],
  );

  return (
    <Calendar
      className="[--cell-size:--spacing(11)] sm:[--cell-size:--spacing(14)] w-full p-0 sm:p-3"
      month={monthFromKey(month)}
      onMonthChange={changeMonth}
      startMonth={monthFromKey(firstMonth)}
      endMonth={monthFromKey(lastMonth)}
      onDayClick={(day) => router.push(`/bookings/date/${format(day, "yyyy-MM-dd")}`)}
      components={{ DayButton: CustomDayButton }}
    />
  );
}
