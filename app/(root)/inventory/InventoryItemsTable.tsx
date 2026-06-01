"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ItemCondition } from "@prisma/client";

import type { getAllInventoryItems } from "@/lib/actions/inventory.actions";

type InventoryItem = Awaited<
  ReturnType<typeof getAllInventoryItems>
>[number];

const CONDITION_META: Record<
  ItemCondition,
  { label: string; bg: string; text: string }
> = {
  NEW:      { label: "New",      bg: "#e3f7e8", text: "#1d7a37" },
  GOOD:     { label: "Good",     bg: "#eef0f3", text: "#3a3a3c" },
  FAIR:     { label: "Fair",     bg: "#fff3e0", text: "#92600a" },
  DAMAGED:  { label: "Damaged",  bg: "#ffeceb", text: "#c0271f" },
  RETIRED:  { label: "Retired",  bg: "#f0f0f2", text: "#86868b" },
};

function sortSizes(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

type SizeSort = "none" | "asc" | "desc";

export default function InventoryItemsTable({
  items,
}: {
  items: InventoryItem[];
}) {
  const [sizeSort, setSizeSort] = useState<SizeSort>("none");

  const rows = useMemo(() => {
    if (sizeSort === "none") return items;
    const dir = sizeSort === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      // items without a size always sink to the bottom
      if (!a.size && !b.size) return 0;
      if (!a.size) return 1;
      if (!b.size) return -1;
      return dir * sortSizes(a.size, b.size);
    });
  }, [items, sizeSort]);

  const cycleSizeSort = () =>
    setSizeSort((s) => (s === "none" ? "asc" : s === "asc" ? "desc" : "none"));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-t border-black/[0.05] text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[#86868b]">
            <th className="px-6 py-2.5 text-left font-semibold">Item</th>
            <th className="px-3 py-2.5 text-left font-semibold">
              <button
                type="button"
                onClick={cycleSizeSort}
                aria-label={`Sort by size (${
                  sizeSort === "none"
                    ? "unsorted"
                    : sizeSort === "asc"
                      ? "ascending"
                      : "descending"
                })`}
                className={`-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-black/[0.04] ${
                  sizeSort === "none" ? "text-[#86868b]" : "text-[#0071e3]"
                }`}
              >
                Size
                <SortGlyph state={sizeSort} />
              </button>
            </th>
            <th className="px-3 py-2.5 text-right font-semibold">Total</th>
            <th className="px-3 py-2.5 text-right font-semibold">Avail.</th>
            <th className="px-3 py-2.5 text-left font-semibold">Condition</th>
            <th className="px-6 py-2.5 text-right font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const out = item.availableQty === 0;
            const cond = CONDITION_META[item.condition];
            return (
              <tr
                key={item.id}
                className="group border-t border-black/[0.05] transition-colors hover:bg-[#f5f5f7]"
              >
                <td className="px-6 py-3 text-[0.9rem] font-medium text-[#1d1d1f]">
                  {item.name}
                </td>
                <td className="px-3 py-3 text-[0.85rem] text-[#6e6e73]">
                  {item.size || "—"}
                </td>
                <td className="px-3 py-3 text-right font-[family-name:var(--font-roboto-mono)] text-[0.85rem] tabular-nums text-[#1d1d1f]">
                  {item.totalQty}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-roboto-mono)] text-[0.85rem] tabular-nums">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: out ? "#ff3b30" : "#34c759" }}
                    />
                    <span style={{ color: out ? "#c0271f" : "#1d1d1f" }}>
                      {item.availableQty}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium"
                    style={{ background: cond.bg, color: cond.text }}
                  >
                    {cond.label}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/inventory/${item.id}`}
                    className="text-[0.83rem] font-medium text-[#0071e3] opacity-70 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* tiny up/down caret pair that highlights the active sort direction */
function SortGlyph({ state }: { state: SizeSort }) {
  const up = state === "asc";
  const down = state === "desc";
  return (
    <span
      aria-hidden
      className="relative inline-flex h-3 w-2.5 flex-col items-center justify-center"
    >
      <span
        className="text-[0.5rem] leading-[0.5] transition-opacity"
        style={{ opacity: up ? 1 : down ? 0.25 : 0.4 }}
      >
        ▲
      </span>
      <span
        className="text-[0.5rem] leading-[0.5] transition-opacity"
        style={{ opacity: down ? 1 : up ? 0.25 : 0.4 }}
      >
        ▼
      </span>
    </span>
  );
}
