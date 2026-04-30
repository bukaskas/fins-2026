"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DayButton } from "react-day-picker";

type DayCount = {
  date: string; // YYYY-MM-DD
  totalPeople: number;
  bookingCount: number;
};

function badgeColor(totalPeople: number) {
  if (totalPeople >= 16) return "text-red-600 dark:text-red-400";
  if (totalPeople >= 6) return "text-amber-600 dark:text-amber-400";
  return "text-blue-600 dark:text-blue-400";
}

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
            ) : data ? (
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none !opacity-100",
                  badgeColor(data.totalPeople),
                )}
              >
                {data.totalPeople}p
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
