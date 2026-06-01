import Link from "next/link";
import { InventoryCategory } from "@prisma/client";

import { getAllInventoryItems } from "@/lib/actions/inventory.actions";
import InventoryItemsTable from "./InventoryItemsTable";

type InventoryItem = Awaited<
  ReturnType<typeof getAllInventoryItems>
>[number];

/* ── category presentation (Apple system-color accents) ───────────────── */
const CATEGORY_ORDER: InventoryCategory[] = [
  "KITE",
  "BOARD",
  "HARNESS",
  "BAR",
  "WETSUIT",
  "ACCESSORY",
  "OTHER",
];

const CATEGORY_META: Record<
  InventoryCategory,
  { label: string; accent: string }
> = {
  KITE:      { label: "Kites",       accent: "#0071e3" },
  BOARD:     { label: "Boards",      accent: "#34c759" },
  HARNESS:   { label: "Harnesses",   accent: "#ff9500" },
  BAR:       { label: "Bars",        accent: "#5e5ce6" },
  WETSUIT:   { label: "Wetsuits",    accent: "#ff2d55" },
  ACCESSORY: { label: "Accessories", accent: "#32ade6" },
  OTHER:     { label: "Other",       accent: "#8e8e93" },
};

const nf = new Intl.NumberFormat("en-US");

function sortSizes(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export default async function InventoryPage() {
  const items = await getAllInventoryItems();

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  const totals = {
    items: items.length,
    units: items.reduce((s, i) => s + i.totalQty, 0),
    available: items.reduce((s, i) => s + i.availableQty, 0),
    out: items.filter((i) => i.availableQty === 0).length,
  };

  return (
    <main className="relative min-h-screen bg-[#f5f5f7]">
      {/* keyframes for the orchestrated load-in */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes invUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
        }}
      />
      {/* faint ambient wash for depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 36rem at 88% -8%, rgba(0,113,227,0.06) 0%, transparent 60%), radial-gradient(48rem 32rem at -6% 108%, rgba(52,199,89,0.05) 0%, transparent 55%)",
        }}
      />

      <div
        className="mx-auto max-w-5xl px-5 pt-14 pb-24 sm:px-8 font-[family-name:var(--font-geist-sans)] text-[#1d1d1f]"
        style={{ animation: "invUp 0.5s ease-out both" }}
      >
        {/* hero */}
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
              Equipment
            </p>
            <h1 className="text-[2.6rem] sm:text-[3rem] font-semibold leading-[0.95] tracking-[-0.03em]">
              Inventory
            </h1>
          </div>
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-[0.86rem] font-medium text-white shadow-[0_4px_14px_-4px_rgba(0,113,227,0.5)] transition-all duration-150 hover:bg-[#0077ed] active:scale-[0.98]"
          >
            <span className="text-[1.05rem] leading-none">+</span>
            Add item
          </Link>
        </header>

        {/* overview stat strip */}
        <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Items" value={nf.format(totals.items)} />
          <Stat label="Total units" value={nf.format(totals.units)} />
          <Stat
            label="Available"
            value={nf.format(totals.available)}
            tone="#1d7a37"
          />
          <Stat
            label="Out of stock"
            value={nf.format(totals.out)}
            tone={totals.out > 0 ? "#c0271f" : undefined}
          />
        </section>

        {groups.length === 0 ? (
          <div className="rounded-[22px] border border-black/[0.06] bg-white py-20 text-center text-[#86868b] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            No inventory items yet.
          </div>
        ) : (
          <div className="space-y-7">
            {groups.map((group, idx) => (
              <CategoryCard
                key={group.category}
                category={group.category}
                items={group.items}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── overview stat tile ───────────────────────────────────────────────── */
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.05] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[#86868b]">
        {label}
      </div>
      <div
        className="mt-1.5 font-[family-name:var(--font-roboto-mono)] text-[1.7rem] font-medium leading-none tabular-nums tracking-[-0.02em]"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/* ── one category = one card ──────────────────────────────────────────── */
function CategoryCard({
  category,
  items,
  index,
}: {
  category: InventoryCategory;
  items: InventoryItem[];
  index: number;
}) {
  const meta = CATEGORY_META[category];

  const totalQty = items.reduce((s, i) => s + i.totalQty, 0);
  const availableQty = items.reduce((s, i) => s + i.availableQty, 0);

  // size → qty summary (only items that carry a size)
  const sizeMap = new Map<string, number>();
  for (const i of items) {
    if (!i.size) continue;
    sizeMap.set(i.size, (sizeMap.get(i.size) ?? 0) + i.totalQty);
  }
  const sizeSummary = [...sizeMap.entries()].sort((a, b) =>
    sortSizes(a[0], b[0]),
  );

  return (
    <section
      className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.14)]"
      style={{
        animation: "invUp 0.55s ease-out both",
        animationDelay: `${120 + index * 70}ms`,
      }}
    >
      {/* card header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: meta.accent,
              boxShadow: `0 0 0 4px ${meta.accent}1f`,
            }}
          />
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em]">
            {meta.label}
          </h2>
          <span className="font-[family-name:var(--font-roboto-mono)] text-[0.8rem] tabular-nums text-[#86868b]">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-5 text-right">
          <SummaryStat label="Total" value={totalQty} />
          <span className="h-7 w-px bg-black/[0.07]" />
          <SummaryStat
            label="Available"
            value={availableQty}
            tone={availableQty === 0 ? "#c0271f" : "#1d7a37"}
          />
        </div>
      </div>

      {/* size: qty summary */}
      {sizeSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-black/[0.05] bg-[#fafafc] px-6 py-3">
          <span className="mr-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[#86868b]">
            By size
          </span>
          {sizeSummary.map(([size, qty]) => (
            <span
              key={size}
              className="inline-flex items-baseline gap-1 rounded-full border border-black/[0.06] bg-white px-2.5 py-1 font-[family-name:var(--font-roboto-mono)] text-[0.74rem] tabular-nums shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
            >
              <span className="font-medium text-[#1d1d1f]">{size}</span>
              <span className="text-[#c7c7cc]">:</span>
              <span className="text-[#6e6e73]">{qty}</span>
            </span>
          ))}
        </div>
      )}

      {/* items table (client-side sortable by size) */}
      <InventoryItemsTable items={items} />
    </section>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div>
      <div className="text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[#86868b]">
        {label}
      </div>
      <div
        className="font-[family-name:var(--font-roboto-mono)] text-[1.05rem] font-medium leading-tight tabular-nums"
        style={tone ? { color: tone } : { color: "#1d1d1f" }}
      >
        {nf.format(value)}
      </div>
    </div>
  );
}
