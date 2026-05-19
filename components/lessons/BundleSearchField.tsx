"use client";

import { useMemo, useRef, useState } from "react";

type BundleProduct = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  creditUnits: number;
};

export default function BundleSearchField({
  bundles,
  selectedId,
  onSelect,
  requiredHours,
  label,
}: {
  bundles: BundleProduct[];
  selectedId: string;
  onSelect: (id: string) => void;
  requiredHours: number;
  label: string;
}) {
  const initial = bundles.find((b) => b.id === selectedId) ?? null;
  const [query, setQuery] = useState(
    initial ? `${initial.name} · ${initial.creditUnits}h` : "",
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter((b) =>
      `${b.name} ${b.sku} ${b.creditUnits}h`.toLowerCase().includes(q),
    );
  }, [bundles, query]);

  function select(b: BundleProduct) {
    onSelect(b.id);
    setQuery(`${b.name} · ${b.creditUnits}h`);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl px-4 py-3 transition-shadow focus-within:shadow-sm"
      style={{
        background: "#f8fbff",
        border: "1px solid rgba(186, 230, 253, 0.6)",
      }}
    >
      <p
        className="text-[0.55rem] tracking-[0.22em] uppercase font-[700] mb-1.5"
        style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selectedId) onSelect("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search bundles by name, SKU, or hours…"
        className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none placeholder:text-[#cbd5e1]"
        style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
      />

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl max-h-80 overflow-y-auto"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 8px 32px rgba(14, 165, 233, 0.12), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
          }}
        >
          {filtered.length === 0 ? (
            <div
              className="px-4 py-3 text-[0.8rem] font-[400]"
              style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
            >
              No bundles match your search.
            </div>
          ) : (
            filtered.map((b, i) => {
              const tooSmall = b.creditUnits < requiredHours;
              return (
                <button
                  key={b.id}
                  type="button"
                  onMouseDown={tooSmall ? undefined : () => select(b)}
                  disabled={tooSmall}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors hover:bg-[#f0f9ff] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(186, 230, 253, 0.3)" : undefined,
                    opacity: tooSmall ? 0.5 : 1,
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="text-[0.88rem] font-[600] truncate"
                      style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                    >
                      {b.name}
                    </div>
                    <div
                      className="text-[0.7rem] truncate"
                      style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
                    >
                      {b.creditUnits}h · {(b.priceCents / 100).toLocaleString()} EGP · {b.sku}
                    </div>
                  </div>
                  {tooSmall && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-[700] tracking-[0.08em] uppercase"
                      style={{
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontFamily: "var(--font-raleway)",
                      }}
                    >
                      too small
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
