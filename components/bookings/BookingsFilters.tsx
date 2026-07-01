"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { BookingStatus } from "@prisma/client";
import { Search, X, CalendarDays, Layers, ArrowDownWideNarrow } from "lucide-react";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all",                              label: "All statuses" },
  { value: BookingStatus.PENDING,              label: "Pending" },
  { value: BookingStatus.REQUEST_SENT,         label: "Request Sent" },
  { value: BookingStatus.UNDER_REVIEW,         label: "Under Review" },
  { value: BookingStatus.WAITING_PAYMENT,      label: "Waiting Payment" },
  { value: BookingStatus.CONFIRMED,            label: "Confirmed" },
  { value: BookingStatus.DECLINED,             label: "Declined" },
  { value: BookingStatus.NO_RESPONSE_EXPIRED,  label: "No Response" },
  { value: BookingStatus.CANCELED,             label: "Canceled" },
];

const SERVICE_OPTIONS = [
  { value: "all",                label: "All services" },
  { value: "day-use",            label: "Day Use" },
  { value: "kitesurfing-course", label: "Kitesurfing" },
  { value: "restaurant",         label: "Restaurant" },
];

const RANGE_OPTIONS = [
  { value: "today",    label: "Today" },
  { value: "week",     label: "This week" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all",      label: "All" },
];

const SORT_OPTIONS = [
  { value: "date",    label: "Visit date" },
  { value: "created", label: "Booked date" },
];

const DIR_OPTIONS = [
  { value: "desc", label: "Newest" },
  { value: "asc",  label: "Oldest" },
];

type AgentOption = { id: string; label: string };

export function BookingsFilters({
  total,
  agents = [],
}: {
  total: number;
  agents?: AgentOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const status  = searchParams.get("status")  ?? "all";
  const q       = searchParams.get("q")       ?? "";
  const service = searchParams.get("service") ?? "all";
  const agent   = searchParams.get("agent")   ?? "all";
  const range   = searchParams.get("range")   ?? "upcoming";
  const group   = searchParams.get("group")   ?? "date";
  const sort    = searchParams.get("sort")    ?? "date";
  const dir     = searchParams.get("dir")     ?? "desc";

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      const defaults: Record<string, string> = { range: "upcoming", group: "date", sort: "date", dir: "desc" };
      if (val && val !== (defaults[key] ?? "all")) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => router.replace(`/bookings?${params.toString()}`));
  }

  function handleSearch(value: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push({ q: value }), 300);
  }

  const isFiltered =
    status !== "all" || q !== "" || service !== "all" || agent !== "all" || range !== "upcoming";

  const selectClass =
    "border border-[#ece8e3] bg-white rounded-full px-3 py-1.5 text-[0.72rem] font-[family-name:var(--font-raleway)] font-[500] text-[#5a5450] tracking-[0.04em] focus:outline-none focus:border-[#1a1614] transition-colors appearance-none cursor-pointer";

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Status + Service */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b0a89f] pointer-events-none" />
          <input
            type="text"
            placeholder="Name, phone or email…"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-[#ece8e3] bg-white rounded-full w-52 text-[0.82rem] font-[family-name:var(--font-raleway)] text-[#1a1614] placeholder:text-[#b0a89f] focus:outline-none focus:border-[#1a1614] transition-colors"
          />
        </div>

        <select value={status}  onChange={(e) => push({ status:  e.target.value })} className={selectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={service} onChange={(e) => push({ service: e.target.value })} className={selectClass}>
          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {agents.length > 0 && (
          <select value={agent} onChange={(e) => push({ agent: e.target.value })} className={selectClass}>
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        )}

        {/* Clear */}
        {isFiltered && (
          <button
            onClick={() => push({ status: "all", q: "", service: "all", agent: "all", range: "upcoming" })}
            className="flex items-center gap-1 text-[0.65rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.08em] text-[#8a8480] hover:text-[#1a1614] transition-colors ml-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] text-[#8a8480]">
          {isPending ? "…" : `${total} booking${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Row 2: Date range + Group toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date range pill group */}
        <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
          <CalendarDays className="h-3 w-3 text-[#b0a89f] ml-2 shrink-0" />
          {RANGE_OPTIONS.map((o) => {
            const active = range === o.value;
            return (
              <button
                key={o.value}
                onClick={() => push({ range: o.value })}
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

        {/* Sort toggle */}
        <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
          <ArrowDownWideNarrow className="h-3 w-3 text-[#b0a89f] ml-2 shrink-0" />
          {SORT_OPTIONS.map((o) => {
            const active = sort === o.value;
            return (
              <button
                key={o.value}
                onClick={() => push({ sort: o.value })}
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

        {/* Direction toggle — only relevant when sorting by booked date */}
        {sort === "created" && (
          <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
            {DIR_OPTIONS.map((o) => {
              const active = dir === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => push({ dir: o.value })}
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
        )}

        {/* Group toggle */}
        <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white ml-auto">
          <Layers className="h-3 w-3 text-[#b0a89f] ml-2 shrink-0" />
          {(["date", "service"] as const).map((g) => {
            const active = group === g;
            return (
              <button
                key={g}
                onClick={() => push({ group: g })}
                className={`px-3 py-1 rounded-full text-[0.65rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.06em] transition-colors ${
                  active
                    ? "bg-[#1a1614] text-white"
                    : "text-[#8a8480] hover:text-[#1a1614]"
                }`}
              >
                {g === "date" ? "By Date" : "By Service"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
