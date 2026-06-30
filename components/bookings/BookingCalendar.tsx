"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DayButton } from "react-day-picker";

type DayCount = {
  date: string; // YYYY-MM-DD
  confirmedPeople: number;
  activePeople: number;
  totalPeople: number;
  bookingCount: number;
};

export function BookingCalendar({
  counts,
  closedDates = [],
}: {
  counts: DayCount[];
  closedDates?: string[]; // YYYY-MM-DD strings
}) {
  const router = useRouter();
  const [month, setMonth] = React.useState(new Date());

  const countMap = React.useMemo(
    () => new Map(counts.map((c) => [c.date, c])),
    [counts],
  );

  const closedSet = React.useMemo(() => new Set(closedDates), [closedDates]);

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
        return (
          <CalendarDayButton day={day} modifiers={modifiers} {...props}>
            <span className={cn(isClosed && "line-through opacity-40")}>{children}</span>
            {isClosed ? (
              <span className="text-[9px] font-semibold leading-none text-red-500 !opacity-100">
                closed
              </span>
            ) : data && (data.confirmedPeople > 0 || data.activePeople > 0) ? (
              <span className="text-[10px] font-semibold leading-none !opacity-100">
                {data.confirmedPeople > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {data.confirmedPeople}
                  </span>
                )}
                {data.confirmedPeople > 0 && data.activePeople > 0 && (
                  <span className="text-muted-foreground mx-0.5">·</span>
                )}
                {data.activePeople > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {data.activePeople}
                  </span>
                )}
              </span>
            ) : null}
          </CalendarDayButton>
        );
      },
    [countMap, closedSet],
  );

  return (
    <Calendar
      className="[--cell-size:--spacing(14)] w-full"
      month={month}
      onMonthChange={setMonth}
      onDayClick={(day) => router.push(`/bookings/date/${format(day, "yyyy-MM-dd")}`)}
      components={{ DayButton: CustomDayButton }}
    />
  );
}
