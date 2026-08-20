"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { BookingStatus } from "@prisma/client";
import {
  Search,
  X,
  CalendarDays,
  Layers,
  ArrowDownWideNarrow,
  ChevronDown,
} from "lucide-react";

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

// Keyboard users had no visible focus state anywhere in this bar.
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2";

// 16px on mobile keeps iOS Safari from zooming the viewport on focus.
const SELECT_CLASS =
  `w-full sm:w-auto border border-[#ece8e3] bg-white rounded-full pl-3 pr-8 py-2 sm:py-1.5 text-base sm:text-[0.72rem] font-[family-name:var(--font-raleway)] font-[500] text-[#5a5450] tracking-[0.04em] focus:border-[#1a1614] transition-colors appearance-none cursor-pointer ${FOCUS_RING}`;

// Pill buttons inside the row-2 toggle groups
const pillClass = (active: boolean) =>
  `px-3 py-1.5 sm:py-1 rounded-full text-[0.72rem] sm:text-[0.65rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.06em] whitespace-nowrap transition-colors ${FOCUS_RING} ${
    active ? "bg-[#1a1614] text-white" : "text-[#6b6460] hover:text-[#1a1614]"
  }`;

/** A `<select>` styled as a pill needs its own chevron — `appearance-none` removes the native one. */
function SelectPill({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6460]" />
    </div>
  );
}

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
  const unpaid  = searchParams.get("unpaid")  ?? "";

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      const defaults: Record<string, string> = { range: "upcoming", group: "date", sort: "date", dir: "desc", unpaid: "" };
      if (val && val !== (defaults[key] ?? "all")) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }
    // Changing a filter restarts paging — an old `limit` would refetch far
    // more rows than the new filter needs.
    params.delete("limit");
    startTransition(() => router.replace(`/bookings?${params.toString()}`));
  }

  function handleSearch(value: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push({ q: value }), 300);
  }

  const isFiltered =
    status !== "all" || q !== "" || service !== "all" || agent !== "all" ||
    range !== "upcoming" || unpaid !== "";

  function clearAll() {
    push({ status: "all", q: "", service: "all", agent: "all", range: "upcoming", unpaid: "" });
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Status + Service */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6460] pointer-events-none" />
          <input
            type="text"
            aria-label="Search bookings"
            placeholder="Name, phone or email…"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            className={`pl-8 pr-3 py-2 sm:py-1.5 border border-[#ece8e3] bg-white rounded-full w-full sm:w-52 text-base sm:text-[0.82rem] font-[family-name:var(--font-raleway)] text-[#1a1614] placeholder:text-[#6b6460] focus:border-[#1a1614] transition-colors ${FOCUS_RING}`}
          />
        </div>

        <SelectPill label="Status" value={status} onChange={(v) => push({ status: v })}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectPill>

        <SelectPill label="Service" value={service} onChange={(v) => push({ service: v })}>
          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectPill>

        {agents.length > 0 && (
          <SelectPill label="Agent" value={agent} onChange={(v) => push({ agent: v })}>
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </SelectPill>
        )}

        {/* Clear + result count */}
        <div className="col-span-2 flex items-center justify-between gap-2 sm:contents">
          {isFiltered ? (
            <button
              onClick={clearAll}
              className={`flex items-center gap-1 rounded-full px-1 text-[0.72rem] sm:text-[0.65rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.08em] text-[#6b6460] hover:text-[#1a1614] transition-colors sm:ml-1 ${FOCUS_RING}`}
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          ) : (
            <span className="sm:hidden" />
          )}

          <span
            aria-live="polite"
            className="font-[family-name:var(--font-raleway)] text-[0.72rem] sm:text-[0.68rem] tracking-[0.08em] text-[#6b6460] sm:ml-auto"
          >
            {isPending ? "…" : `${total} booking${total !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Row 2: Date range + Group toggle */}
      <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Date range pill group */}
        <div className="flex shrink-0 items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
          <CalendarDays className="h-3 w-3 text-[#6b6460] ml-2 shrink-0" />
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => push({ range: o.value })}
              aria-pressed={range === o.value}
              className={pillClass(range === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="flex shrink-0 items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
          <ArrowDownWideNarrow className="h-3 w-3 text-[#6b6460] ml-2 shrink-0" />
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => push({ sort: o.value })}
              aria-pressed={sort === o.value}
              className={pillClass(sort === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Direction toggle — only relevant when sorting by booked date */}
        {sort === "created" && (
          <div className="flex shrink-0 items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white">
            {DIR_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => push({ dir: o.value })}
                aria-pressed={dir === o.value}
                className={pillClass(dir === o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Group toggle */}
        <div className="flex shrink-0 items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white sm:ml-auto">
          <Layers className="h-3 w-3 text-[#6b6460] ml-2 shrink-0" />
          {(["date", "service"] as const).map((g) => (
            <button
              key={g}
              onClick={() => push({ group: g })}
              aria-pressed={group === g}
              className={pillClass(group === g)}
            >
              {g === "date" ? "By Date" : "By Service"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
