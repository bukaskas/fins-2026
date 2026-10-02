"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  conversionRate,
  SELF_SERVE_KEY,
  type AgentStatsRow,
} from "@/lib/bookings/agent-stats";
import { formatEGP } from "@/lib/commission";

type SortKey =
  | "name"
  | "confirmedCount"
  | "openCount"
  | "lostCount"
  | "conv"
  | "revenueCents"
  | "outstandingCents"
  | "avgTicket"
  | "firstResponse"
  | "contactsLogged"
  | "overdueFollowUps";

const COLUMNS: { key: SortKey; label: string; align?: "left" }[] = [
  { key: "name", label: "Agent", align: "left" },
  { key: "confirmedCount", label: "Confirmed" },
  { key: "openCount", label: "Open" },
  { key: "lostCount", label: "Lost" },
  { key: "conv", label: "Conv %" },
  { key: "revenueCents", label: "Booked value" },
  { key: "outstandingCents", label: "Outstanding" },
  { key: "avgTicket", label: "Avg ticket" },
  { key: "firstResponse", label: "1st response" },
  { key: "contactsLogged", label: "Contacts" },
  { key: "overdueFollowUps", label: "Overdue" },
];

function avgTicket(row: AgentStatsRow): number | null {
  return row.pricedCount > 0 ? row.revenueCents / row.pricedCount : null;
}

/** Sortable value per column; null always sorts last. */
function sortValue(row: AgentStatsRow, key: SortKey): number | string | null {
  switch (key) {
    case "name":
      return row.name;
    case "conv":
      return conversionRate(row);
    case "avgTicket":
      return avgTicket(row);
    case "firstResponse":
      return row.medianFirstResponseMs;
    default:
      return row[key];
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.max(Math.round(ms / 60000), 0);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function percent(rate: number | null): string {
  return rate === null ? "n/a" : `${Math.round(rate * 100)}%`;
}

export function AgentStatsTable({ rows }: { rows: AgentStatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("confirmedCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const agents = rows.filter((r) => r.key !== SELF_SERVE_KEY);
    const selfServe = rows.filter((r) => r.key === SELF_SERVE_KEY);
    const direction = sortDir === "asc" ? 1 : -1;

    agents.sort((a, b) => {
      const x = sortValue(a, sortKey);
      const y = sortValue(b, sortKey);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      if (typeof x === "string" || typeof y === "string") {
        return direction * String(x).localeCompare(String(y));
      }
      return direction * (x - y);
    });

    return [...agents, ...selfServe];
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Names read A–Z and a fast response is a low number.
      setSortDir(key === "name" || key === "firstResponse" ? "asc" : "desc");
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-white border border-[#ece8e3] p-8 text-center font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#6b6460]">
        Nothing recorded for you in this period yet.
      </div>
    );
  }

  return (
    <>
      {/* Phones: one card per agent */}
      <div className="md:hidden">
        <label className="flex items-center gap-2 mb-3 font-[family-name:var(--font-raleway)] text-[0.7rem] text-[#6b6460]">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => handleSort(e.target.value as SortKey)}
            className="border border-[#ece8e3] bg-white px-2 py-1.5 text-[0.78rem] text-[#1a1614]"
          >
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <ul className="space-y-3">
          {sorted.map((row) => (
            <li
              key={row.key}
              className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(26,22,20,0.08)] p-4 font-[family-name:var(--font-raleway)]"
            >
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <AgentName row={row} />
                <span className="text-[0.78rem] text-[#6b6460] tabular-nums">
                  {percent(conversionRate(row))} conv
                </span>
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-3 text-[0.82rem] text-[#1a1614]">
                <Stat label="Confirmed" value={row.confirmedCount} tone="#15803d" />
                <Stat label="Open" value={row.openCount} />
                <Stat label="Lost" value={row.lostCount} tone="#b91c1c" />
                <Stat label="Booked value" value={formatEGP(row.revenueCents)} />
                <Stat label="Outstanding" value={formatEGP(row.outstandingCents)} />
                <Stat
                  label="1st response"
                  value={
                    row.medianFirstResponseMs === null
                      ? "—"
                      : formatDuration(row.medianFirstResponseMs)
                  }
                />
                <Stat label="Contacts" value={row.contactsLogged} />
                <Stat
                  label="Overdue"
                  value={row.overdueFollowUps}
                  tone={row.overdueFollowUps > 0 ? "#b45309" : undefined}
                />
                <Stat label="Declined" value={row.declinedCount} />
              </dl>
              <RowNotes row={row} className="mt-3" />
            </li>
          ))}
        </ul>
      </div>

      {/* Tablet and up: sortable table */}
      <div className="hidden md:block bg-white border border-[#ece8e3] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#faf9f7] border-b border-[#ece8e3]">
            <tr className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.18em] uppercase font-[700] text-[#6b6460]">
              {COLUMNS.map((c) => (
                <Th
                  key={c.key}
                  label={c.label}
                  sortKey={c.key}
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                  align={c.align ?? "right"}
                />
              ))}
            </tr>
          </thead>
          <tbody className="font-[family-name:var(--font-raleway)] text-[0.82rem] text-[#1a1614]">
            {sorted.map((row) => {
              const ticket = avgTicket(row);
              return (
                <tr
                  key={row.key}
                  className={`border-b border-[#f3f0eb] align-top ${
                    row.key === SELF_SERVE_KEY ? "bg-[#fbfaf7]" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-[500]">
                    <AgentName row={row} />
                    <RowNotes row={row} className="mt-1" />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#15803d]">
                    {row.confirmedCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.openCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#b91c1c]">
                    {row.lostCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {percent(conversionRate(row))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatEGP(row.revenueCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatEGP(row.outstandingCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {ticket === null ? "—" : formatEGP(ticket)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.medianFirstResponseMs === null
                      ? "—"
                      : formatDuration(row.medianFirstResponseMs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.contactsLogged}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      row.overdueFollowUps > 0 ? "text-[#b45309]" : ""
                    }`}
                  >
                    {row.overdueFollowUps}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AgentName({ row }: { row: AgentStatsRow }) {
  if (!row.agentId) {
    return <span className="font-[500] text-[#6b6460]">{row.name}</span>;
  }
  return (
    <Link
      href={`/bookings?agent=${row.agentId}&range=all`}
      className="font-[500] text-[#1a1614] hover:underline"
    >
      {row.name}
    </Link>
  );
}

/** The figures that qualify a row's headline numbers, shown only when non-zero. */
function RowNotes({ row, className = "" }: { row: AgentStatsRow; className?: string }) {
  const notes = [
    row.key === SELF_SERVE_KEY && "Booked and paid online, no staff involved",
    row.declinedCount > 0 && `${row.declinedCount} declined (not in conv %)`,
    row.cancelledAfterConfirmCount > 0 &&
      `${row.cancelledAfterConfirmCount} cancelled after confirming`,
    row.unpricedCount > 0 && `${row.unpricedCount} unpriced`,
  ].filter(Boolean);
  if (notes.length === 0) return null;
  return (
    <p className={`text-[0.7rem] font-[400] text-[#6b6460] ${className}`}>
      {notes.join(" · ")}
    </p>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-[0.6rem] tracking-[0.12em] uppercase font-[600] text-[#6b6460]">
        {label}
      </dt>
      <dd className="tabular-nums mt-0.5" style={tone ? { color: tone } : undefined}>
        {value}
      </dd>
    </div>
  );
}

function Th({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
  align: "left" | "right";
}) {
  const active = current === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} whitespace-nowrap`}
    >
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-[inherit] font-[inherit] cursor-pointer ${
          active ? "text-[#1a1614]" : ""
        }`}
      >
        {label}
        {active &&
          (dir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </button>
    </th>
  );
}
