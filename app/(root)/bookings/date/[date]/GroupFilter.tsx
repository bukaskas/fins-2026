"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, Users } from "lucide-react";

import { FOCUS_RING } from "@/lib/bookings/status";
import { useFilterTransition } from "./FilterTransition";

export const GROUP_OPTIONS = [
  { value: "all", label: "All groups" },
  { value: "KAI_OWNER", label: "Kai owners" },
  { value: "SPECTATOR", label: "Spectators" },
  { value: "KITE_COMMUNITY", label: "Kite community" },
];

export function GroupFilter({ value }: { value: string }) {
  const pathname = usePathname();
  const { navigate } = useFilterTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    const v = e.target.value;
    if (v && v !== "all") {
      params.set("group", v);
    } else {
      params.delete("group");
    }
    const qs = params.toString();
    navigate(qs ? `${pathname}?${qs}` : pathname, { replace: true });
  }

  return (
    <div className="relative mt-3 md:mt-0 md:w-52">
      <Users
        className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b0a89f] pointer-events-none"
        aria-hidden="true"
      />
      <select
        aria-label="Filter by group"
        value={value}
        onChange={handleChange}
        className={`appearance-none w-full min-h-11 pl-9 pr-9 py-2 text-base sm:text-[0.72rem] bg-[#f5f3f0] border border-[#ece8e3] text-[#1a1614] focus:border-[#8a8480] font-[family-name:var(--font-raleway)] rounded-sm ${FOCUS_RING}`}
      >
        {GROUP_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b6460] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
