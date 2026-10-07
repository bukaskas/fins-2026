"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  Search,
  X,
  CalendarDays,
  Layers,
  ArrowDownWideNarrow,
  ChevronDown,
} from "lucide-react";
import {
  parseBookingStatusFilter,
  serializeBookingStatusFilter,
  STATUS_BORDER,
  STATUS_GROUPS,
  STATUS_LABEL,
} from "@/lib/bookings/status";

const SERVICE_OPTIONS = [
  { value: "all", label: "All services" },
  { value: "day-use", label: "Day Use" },
  { value: "kitesurfing-course", label: "Kitesurfing" },
  { value: "restaurant", label: "Restaurant" },
];

const KIND_OPTIONS = [
  { value: "all", label: "All guests" },
  { value: "KAI_OWNER", label: "Kai owners" },
  { value: "KITE_COMMUNITY", label: "Kite community" },
  { value: "none", label: "No group" },
];

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Visit date" },
  { value: "created", label: "Booked date" },
];

const DIR_OPTIONS = [
  { value: "desc", label: "Newest" },
  { value: "asc", label: "Oldest" },
];

// Keyboard users had no visible focus state anywhere in this bar.
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1614] focus-visible:ring-offset-2";

// 16px on mobile keeps iOS Safari from zooming the viewport on focus.
const SELECT_CLASS = `min-h-11 w-full sm:w-auto border border-[#ece8e3] bg-[#faf9f7] rounded-full pl-3 pr-9 py-2 text-base sm:text-[0.78rem] font-[family-name:var(--font-raleway)] font-[500] text-[#5a5450] tracking-[0.04em] focus:border-[#1a1614] transition-colors appearance-none cursor-pointer ${FOCUS_RING}`;

// Pill buttons inside the row-2 toggle groups
const pillClass = (active: boolean) =>
  `min-h-10 px-3 py-2 rounded-full text-[0.75rem] sm:text-[0.7rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.04em] whitespace-nowrap transition-colors ${FOCUS_RING} ${
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

function BookingStatusFilter({
  status,
  onChange,
}: {
  status: string;
  onChange: (value: string) => void;
}) {
  const [selectedStatuses, setSelectedStatuses] = useState(() =>
    parseBookingStatusFilter(status),
  );
  const selectionRef = useRef(selectedStatuses);

  function toggleStatus(value: (typeof selectedStatuses)[number]) {
    const current = selectionRef.current;
    const next = current.includes(value)
      ? current.filter((status) => status !== value)
      : [...current, value];

    selectionRef.current = next;
    setSelectedStatuses(next);
    onChange(serializeBookingStatusFilter(next));
  }

  return (
    <fieldset className="min-w-0 sm:col-span-2">
      <legend className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
        Booking status
      </legend>
      <p className="mb-2 mt-0.5 font-[family-name:var(--font-raleway)] text-[0.72rem] text-[#6b6460]">
        {selectedStatuses.length === 0
          ? "Showing all statuses"
          : `${selectedStatuses.length} selected`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
              {group.label}
            </p>
            <div className="grid gap-1.5">
              {group.statuses.map((value) => {
                const checked = selectedStatuses.includes(value);

                return (
                  <label
                    key={value}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[500] transition-colors focus-within:ring-2 focus-within:ring-[#1a1614] focus-within:ring-offset-2 ${
                      checked
                        ? "border-[#1a1614] bg-[#f5f2ef] text-[#1a1614]"
                        : "border-[#ece8e3] bg-white text-[#5a5450] hover:border-[#d6d0c8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStatus(value)}
                      className="size-4 shrink-0 cursor-pointer accent-[#1a1614] focus-visible:outline-none"
                    />
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_BORDER[value] }}
                      aria-hidden="true"
                    />
                    <span>{STATUS_LABEL[value]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 font-[family-name:var(--font-raleway)] text-[0.72rem] text-[#6b6460]">
        Leave every box unchecked to include all booking statuses.
      </p>
    </fieldset>
  );
}

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const status = searchParams.get("status") ?? "all";
  const selectedStatuses = parseBookingStatusFilter(status);
  const q = searchParams.get("q") ?? "";
  const service = searchParams.get("service") ?? "all";
  const agent = searchParams.get("agent") ?? "all";
  const kind = searchParams.get("kind") ?? "all";
  const range = searchParams.get("range") ?? "upcoming";
  const group = searchParams.get("group") ?? "date";
  const sort = searchParams.get("sort") ?? "date";
  const dir = searchParams.get("dir") ?? "desc";
  const unpaid = searchParams.get("unpaid") ?? "";

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      const defaults: Record<string, string> = {
        range: "upcoming",
        group: "date",
        sort: "date",
        dir: "desc",
        unpaid: "",
      };
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
    selectedStatuses.length > 0 ||
    q !== "" ||
    service !== "all" ||
    kind !== "all" ||
    agent !== "all" ||
    range !== "upcoming" ||
    unpaid !== "";

  const advancedCount = [
    selectedStatuses.length > 0,
    agent !== "all",
    range !== "upcoming",
    sort !== "date",
    sort === "created" && dir !== "desc",
    group !== "date",
  ].filter(Boolean).length;
  const [advancedOpen, setAdvancedOpen] = useState(advancedCount > 0);

  function clearAll() {
    clearTimeout(timerRef.current);
    if (searchInputRef.current) searchInputRef.current.value = "";
    push({
      status: "all",
      q: "",
      service: "all",
      kind: "all",
      agent: "all",
      range: "upcoming",
      unpaid: "",
    });
  }

  return (
    <div>
      {/* Frequent desk filters stay visible. */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative col-span-2 sm:min-w-64 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6460] pointer-events-none" />
          <input
            type="text"
            ref={searchInputRef}
            aria-label="Search bookings"
            placeholder="Name, phone, email or unit…"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            className={`min-h-11 w-full rounded-full border border-[#ece8e3] bg-[#faf9f7] py-2 pl-8 pr-3 text-base font-[family-name:var(--font-raleway)] text-[#1a1614] placeholder:text-[#6b6460] transition-colors focus:border-[#1a1614] sm:text-[0.85rem] ${FOCUS_RING}`}
          />
        </div>

        <SelectPill
          label="Service"
          value={service}
          onChange={(v) => push({ service: v })}
        >
          {SERVICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectPill>

        <SelectPill
          label="Guest group"
          value={kind}
          onChange={(v) => push({ kind: v })}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectPill>

        <div className="col-span-2 flex min-h-10 items-center justify-between gap-3 sm:ml-auto">
          {isFiltered ? (
            <button
              onClick={clearAll}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[0.75rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.06em] text-[#6b6460] transition-colors hover:text-[#1a1614] ${FOCUS_RING}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          ) : (
            <span className="sm:hidden" />
          )}

          <span
            aria-live="polite"
            className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.06em] text-[#6b6460]"
          >
            {isPending
              ? "Updating…"
              : `${total} booking${total !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      <details
        className="group mt-2 border-t border-[#ece8e3]"
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary
          className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[600] tracking-[0.04em] text-[#5a5450] transition-colors hover:bg-[#faf9f7] hover:text-[#1a1614] [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
        >
          More filters
          {advancedCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#1a1614] px-1.5 py-0.5 text-[0.72rem] font-[700] text-white">
              {advancedCount}
            </span>
          )}
          <ChevronDown
            className="ml-auto h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="grid min-w-0 gap-4 pb-2 pt-3 sm:grid-cols-2">
          <BookingStatusFilter
            key={status}
            status={status}
            onChange={(value) => push({ status: value })}
          />

          {agents.length > 0 && (
            <div>
              <p className="mb-1.5 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
                Assigned to
              </p>
              <SelectPill
                label="Assigned agent"
                value={agent}
                onChange={(v) => push({ agent: v })}
              >
                <option value="all">All agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </SelectPill>
            </div>
          )}

          <fieldset className="min-w-0">
            <legend className="mb-1.5 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
              Visit window
            </legend>
            <div className="flex max-w-full flex-wrap items-center gap-1 rounded-[1.35rem] border border-[#ece8e3] bg-[#faf9f7] p-0.5">
              <CalendarDays
                className="ml-2 h-3.5 w-3.5 shrink-0 text-[#6b6460]"
                aria-hidden="true"
              />
              {RANGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => push({ range: o.value })}
                  aria-pressed={range === o.value}
                  className={pillClass(range === o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-1.5 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
              Sort by
            </legend>
            <div className="flex max-w-full flex-wrap items-center gap-1 rounded-[1.35rem] border border-[#ece8e3] bg-[#faf9f7] p-0.5">
              <ArrowDownWideNarrow
                className="ml-2 h-3.5 w-3.5 shrink-0 text-[#6b6460]"
                aria-hidden="true"
              />
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => push({ sort: o.value })}
                  aria-pressed={sort === o.value}
                  className={pillClass(sort === o.value)}
                >
                  {o.label}
                </button>
              ))}
              {sort === "created" &&
                DIR_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => push({ dir: o.value })}
                    aria-pressed={dir === o.value}
                    className={pillClass(dir === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-1.5 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[600] text-[#6b6460]">
              Group results
            </legend>
            <div className="flex max-w-full flex-wrap items-center gap-1 rounded-[1.35rem] border border-[#ece8e3] bg-[#faf9f7] p-0.5">
              <Layers
                className="ml-2 h-3.5 w-3.5 shrink-0 text-[#6b6460]"
                aria-hidden="true"
              />
              {(["date", "service"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => push({ group: g })}
                  aria-pressed={group === g}
                  className={pillClass(group === g)}
                >
                  {g === "date" ? "By date" : "By service"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  );
}
