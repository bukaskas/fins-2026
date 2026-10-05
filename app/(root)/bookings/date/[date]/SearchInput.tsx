"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { FOCUS_RING } from "@/lib/bookings/status";
import { useFilterTransition } from "./FilterTransition";

const DEBOUNCE_MS = 250;

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const pathname = usePathname();
  const { navigate } = useFilterTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Read the live URL, not a render-time snapshot, so a tab or agent change
      // made during the debounce isn't overwritten.
      const params = new URLSearchParams(window.location.search);
      if (value) params.set("q", value);
      else params.delete("q");
      const qs = params.toString();
      navigate(qs ? `${pathname}?${qs}` : pathname, { replace: true });
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative mt-5">
      <Search
        className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b0a89f] pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label="Search bookings by name, email or phone"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search by name, email or phone…"
        className={`w-full min-h-11 pl-9 pr-4 py-2 text-base sm:text-[0.72rem] bg-[#f5f3f0] border border-[#ece8e3] text-[#1a1614] placeholder:text-[#6b6460] focus:border-[#8a8480] font-[family-name:var(--font-raleway)] rounded-sm ${FOCUS_RING}`}
      />
    </div>
  );
}
