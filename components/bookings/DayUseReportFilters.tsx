"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, Users } from "lucide-react";

type Agent = { id: string; name: string | null; email: string };

export function DayUseReportFilters({
  agents,
  month,
  agentId,
}: {
  agents: Agent[];
  month: string; // YYYY-MM
  agentId: string; // "all" or an agent id
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(next: { month?: string; agentId?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.month !== undefined) params.set("month", next.month);
    if (next.agentId !== undefined) {
      if (next.agentId === "all") params.delete("agentId");
      else params.set("agentId", next.agentId);
    }

    startTransition(() =>
      router.replace(
        params.toString() ? `/bookings/day-use?${params.toString()}` : "/bookings/day-use",
      ),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 border border-[#ece8e3] rounded-full pl-3 pr-1 py-0.5 bg-white">
        <CalendarDays className="h-3 w-3 text-[#b0a89f] shrink-0" />
        <input
          type="month"
          value={month}
          onChange={(e) => update({ month: e.target.value })}
          className="bg-transparent px-2 py-1 text-[0.7rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.04em] text-[#1a1614] focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-1.5 border border-[#ece8e3] rounded-full pl-3 pr-1 py-0.5 bg-white">
        <Users className="h-3 w-3 text-[#b0a89f] shrink-0" />
        <select
          value={agentId}
          onChange={(e) => update({ agentId: e.target.value })}
          className="bg-transparent px-2 py-1 text-[0.7rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.04em] text-[#1a1614] focus:outline-none"
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.email}
            </option>
          ))}
        </select>
      </label>

      <span className="ml-auto font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] text-[#8a8480]">
        {isPending ? "…" : ""}
      </span>
    </div>
  );
}
