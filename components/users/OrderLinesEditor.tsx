"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import ProductSearchField, {
  type ProductSearchOption,
} from "@/components/products/ProductSearchField";

export type StagedLine = {
  productId: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  qty: number;
};

export default function OrderLinesEditor({
  products,
  initialLines,
  onChange,
  disabled,
  allowBundles = true,
}: {
  products: ProductSearchOption[];
  initialLines?: StagedLine[];
  onChange?: (lines: StagedLine[]) => void;
  disabled?: boolean;
  allowBundles?: boolean;
}) {
  const [lines, setLines] = useState<StagedLine[]>(initialLines ?? []);

  const filteredProducts = useMemo(() => {
    if (allowBundles) return products;
    return products.filter((p) => p.type !== "BUNDLE_CREDIT");
  }, [products, allowBundles]);

  function update(next: StagedLine[]) {
    setLines(next);
    onChange?.(next);
  }

  function add(p: ProductSearchOption) {
    const existing = lines.findIndex((l) => l.productId === p.id);
    if (existing >= 0) {
      const next = [...lines];
      next[existing] = { ...next[existing], qty: next[existing].qty + 1 };
      update(next);
      return;
    }
    update([
      ...lines,
      {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unitPriceCents: p.priceCents,
        qty: 1,
      },
    ]);
  }

  function setQty(productId: string, qty: number) {
    update(
      lines.map((l) =>
        l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l,
      ),
    );
  }

  function remove(productId: string) {
    update(lines.filter((l) => l.productId !== productId));
  }

  const total = lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);

  return (
    <div className="space-y-4">
      <ProductSearchField
        products={filteredProducts}
        onSelect={add}
        placeholder="Add a product…"
      />

      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No lines yet. Search for a product above to add one.
        </p>
      ) : (
        <div className="rounded-md border divide-y">
          {lines.map((l) => (
            <div
              key={l.productId}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {l.sku} · {(l.unitPriceCents / 100).toLocaleString()} EGP each
                </div>
              </div>
              <input
                type="number"
                min={1}
                value={l.qty}
                onChange={(e) =>
                  setQty(l.productId, parseInt(e.target.value || "1", 10) || 1)
                }
                disabled={disabled}
                className="w-16 rounded-md border bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="w-24 shrink-0 text-right tabular-nums">
                {((l.unitPriceCents * l.qty) / 100).toLocaleString()} EGP
              </span>
              <button
                type="button"
                onClick={() => remove(l.productId)}
                disabled={disabled}
                className="text-muted-foreground hover:text-red-600 transition-colors"
                aria-label={`Remove ${l.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {(total / 100).toLocaleString()} EGP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
