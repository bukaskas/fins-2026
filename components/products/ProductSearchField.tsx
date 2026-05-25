"use client";

import { useMemo, useRef, useState } from "react";
import { ProductType } from "@prisma/client";

export type ProductSearchOption = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  type: ProductType;
};

export default function ProductSearchField({
  products,
  onSelect,
  placeholder = "Search products by name or SKU…",
  label = "Product",
}: {
  products: ProductSearchOption[];
  onSelect: (product: ProductSearchOption) => void;
  placeholder?: string;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 10);
    return products
      .filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [products, query]);

  function pick(p: ProductSearchOption) {
    onSelect(p);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-md border bg-popover shadow-md">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => pick(p)}
              className="w-full px-3 py-2 text-left flex items-center gap-3 text-sm hover:bg-muted/50 transition-colors"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
            >
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                  p.type === ProductType.BUNDLE_CREDIT
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {p.type === ProductType.BUNDLE_CREDIT ? "Bundle" : "Service"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.sku}</div>
              </div>
              <span className="shrink-0 text-sm tabular-nums">
                {(p.priceCents / 100).toLocaleString()} EGP
              </span>
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 px-3 py-2 rounded-md border bg-popover text-xs text-muted-foreground shadow-md">
          No matching product.
        </div>
      )}
    </div>
  );
}
