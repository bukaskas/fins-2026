"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { AgentStatsRow } from "@/lib/actions/booking.actions";
import { formatEGP } from "@/lib/commission";

type SortKey =
  | "name"
  | "touched"
  | "confirmedCount"
  | "conv"
  | "declinedCount"
  | "revenueCents"
  | "collectedCents"
  | "avgTicket"
  | "topService";

const SERVICE_LABELS: Record<string, string> = {
  "day-use": "Day Use",
  "kitesurfing-course": "Kitesurfing",
  restaurant: "Restaurant",
  "pharaoh-airstyle": "Pharaoh",
};

function serviceLabel(value: string | null) {
  if (!value) return "—";
  return SERVICE_LABELS[value] ?? value;
}

function conversion(row: AgentStatsRow) {
  const decided = row.confirmedCount + row.declinedCount;
  if (decided === 0) return null;
  return row.confirmedCount / decided;
}

function avgTicket(row: AgentStatsRow) {
  if (row.confirmedCount === 0) return 0;
  return row.revenueCents / row.confirmedCount;
}

export function AgentStatsTable({ rows }: { rows: AgentStatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("touched");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const named = rows.filter((r) => r.agentId !== null);
    const unassigned = rows.filter((r) => r.agentId === null);

    const compareNumber = (a: number, b: number) =>
      sortDir === "asc" ? a - b : b - a;
    const compareString = (a: string, b: string) =>
      sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a);

    named.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return compareString(a.name, b.name);
        case "touched":
          return compareNumber(a.touched, b.touched);
        case "confirmedCount":
          return compareNumber(a.confirmedCount, b.confirmedCount);
        case "conv":
          return compareNumber(conversion(a) ?? -1, conversion(b) ?? -1);
        case "declinedCount":
          return compareNumber(a.declinedCount, b.declinedCount);
        case "revenueCents":
          return compareNumber(a.revenueCents, b.revenueCents);
        case "collectedCents":
          return compareNumber(a.collectedCents, b.collectedCents);
        case "avgTicket":
          return compareNumber(avgTicket(a), avgTicket(b));
        case "topService":
          return compareString(a.topService ?? "", b.topService ?? "");
      }
    });

    return [...named, ...unassigned];
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "topService" ? "asc" : "desc");
    }
  }

  return (
    <div className="bg-white border border-[#ece8e3] overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#faf9f7] border-b border-[#ece8e3]">
          <tr className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.18em] uppercase font-[700] text-[#8a8480]">
            <Th label="Agent" sortKey="name" current={sortKey} dir={sortDir} onClick={handleSort} align="left" />
            <Th label="Touched" sortKey="touched" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Confirmed" sortKey="confirmedCount" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Conv %" sortKey="conv" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Declined" sortKey="declinedCount" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Revenue" sortKey="revenueCents" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Collected" sortKey="collectedCents" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Avg ticket" sortKey="avgTicket" current={sortKey} dir={sortDir} onClick={handleSort} />
            <Th label="Top service" sortKey="topService" current={sortKey} dir={sortDir} onClick={handleSort} align="left" />
          </tr>
        </thead>
        <tbody className="font-[family-name:var(--font-raleway)] text-[0.82rem] text-[#1a1614]">
          {sorted.map((row) => {
            const conv = conversion(row);
            const isUnassigned = row.agentId === null;
            return (
              <tr
                key={row.agentId ?? "unassigned"}
                className={`border-b border-[#f3f0eb] ${
                  isUnassigned ? "bg-[#fbfaf7] text-[#8a8480]" : ""
                }`}
              >
                <td className="px-4 py-3 font-[500]">
                  {isUnassigned ? (
                    <span>Unassigned</span>
                  ) : row.email ? (
                    <Link
                      href={`/bookings?q=${encodeURIComponent(row.email)}`}
                      className="hover:underline text-[#1a1614]"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{row.touched}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[#15803d]">
                  {row.confirmedCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {conv === null ? "—" : `${Math.round(conv * 100)}%`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#b91c1c]">
                  {row.declinedCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatEGP(row.revenueCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatEGP(row.collectedCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.confirmedCount > 0 ? formatEGP(avgTicket(row)) : "—"}
                </td>
                <td className="px-4 py-3 text-[0.78rem]">{serviceLabel(row.topService)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = current === sortKey;
  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} cursor-pointer select-none whitespace-nowrap`}
      onClick={() => onClick(sortKey)}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""} ${
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
      </span>
    </th>
  );
}
