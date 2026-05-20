"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last30", label: "Last 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

export function AgentStatsRangePills({ rangeLabel }: { rangeLabel: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const range = searchParams.get("range") ?? "month";

  function setRange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "month") params.delete("range");
    else params.set("range", next);
    startTransition(() =>
      router.replace(
        params.toString() ? `/bookings/agents?${params.toString()}` : "/bookings/agents",
      ),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
        <CalendarDays className="h-3 w-3 text-[#b0a89f] ml-2 shrink-0" />
        {RANGE_OPTIONS.map((o) => {
          const active = range === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3 py-1 rounded-full text-[0.65rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.06em] transition-colors ${
                active
                  ? "bg-[#1a1614] text-white"
                  : "text-[#8a8480] hover:text-[#1a1614]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <span className="ml-auto font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] text-[#8a8480]">
        {isPending ? "…" : rangeLabel}
      </span>
    </div>
  );
}
