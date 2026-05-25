"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LessonType } from "@prisma/client";
import { LESSON_CANONICAL_MINUTES } from "@/lib/lesson-products";

const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  PRIVATE:       "Private",
  GROUP:         "Group",
  EXTRA_PRIVATE: "Extra Private",
  EXTRA_GROUP:   "Extra Group",
  FOIL:          "Foil",
  KIDS:          "Kids",
};

export type LessonProductSearchOption = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  lessonType: LessonType;
  referenceDurationMinutes: number | null;
};

export default function LessonProductSearchField({
  products,
  initialProductId,
  onSelect,
  name = "productId",
}: {
  products: LessonProductSearchOption[];
  initialProductId?: string;
  onSelect?: (productId: string) => void;
  name?: string;
}) {
  const initial = products.find((p) => p.id === initialProductId) ?? null;
  const [query, setQuery] = useState(initial ? formatLabel(initial) : "");
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initial && onSelect) onSelect(initial.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 10);
    return products
      .filter((p) =>
        `${p.name} ${p.sku} ${LESSON_TYPE_LABEL[p.lessonType]}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 10);
  }, [products, query]);

  function select(p: LessonProductSearchOption) {
    setSelectedId(p.id);
    setQuery(formatLabel(p));
    setOpen(false);
    onSelect?.(p.id);
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
        Product
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selectedId) {
            setSelectedId("");
            onSelect?.("");
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search by name, SKU, or lesson type…"
        className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none placeholder:text-[#cbd5e1]"
        style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
      />

      <input type="hidden" name={name} value={selectedId} required />

      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 8px 32px rgba(14, 165, 233, 0.12), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
          }}
        >
          {filtered.map((p, i) => {
            const refMin =
              p.referenceDurationMinutes ?? LESSON_CANONICAL_MINUTES[p.lessonType];
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => select(p)}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-[#f0f9ff]"
                style={{
                  borderTop: i > 0 ? "1px solid rgba(186, 230, 253, 0.3)" : undefined,
                }}
              >
                <span
                  className="shrink-0 px-2 py-0.5 rounded-full text-[0.6rem] font-[700] tracking-[0.04em]"
                  style={{
                    background: "rgba(14, 165, 233, 0.1)",
                    color: "#0369a1",
                    fontFamily: "var(--font-raleway)",
                  }}
                >
                  {LESSON_TYPE_LABEL[p.lessonType]}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[0.85rem] font-[500] truncate"
                    style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                  >
                    {p.name}
                  </div>
                  <div
                    className="text-[0.7rem] truncate"
                    style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
                  >
                    {p.sku} · {refMin}m reference
                  </div>
                </div>
                <span
                  className="shrink-0 text-[0.82rem] font-[500] tabular-nums"
                  style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                >
                  {(p.priceCents / 100).toLocaleString()} EGP
                </span>
              </button>
            );
          })}
        </div>
      )}

      {open && filtered.length === 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 px-4 py-3 rounded-2xl text-[0.78rem]"
          style={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
            color: "#94a3b8",
            fontFamily: "var(--font-raleway)",
          }}
        >
          No matching lesson products. Create one in <code>/products</code>.
        </div>
      )}
    </div>
  );
}

function formatLabel(p: LessonProductSearchOption) {
  return `${p.name} · ${(p.priceCents / 100).toLocaleString()} EGP`;
}
