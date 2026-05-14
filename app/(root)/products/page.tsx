import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllProducts } from "@/lib/actions/product.actions";
import { ProductType } from "@prisma/client";
import { ProductsFilters } from "@/components/products/ProductsFilters";
import { ProductDialog } from "@/components/products/ProductDialog";
import { ToggleActiveButton } from "@/components/products/ToggleActiveButton";
import { Package, Plus } from "lucide-react";

const ALLOWED_ROLES = ["ADMIN", "OWNER", "ACCOUNTANT"];

function formatEgp(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "EGP",
  });
}

const WALLET_TYPE_LABEL: Record<string, string> = {
  BEACH_USE:    "Beach Use",
  LESSON_HOURS: "Lesson Hours",
};

type Props = {
  searchParams: Promise<{ type?: string; status?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  if (!ALLOWED_ROLES.includes((session.user as any)?.role)) redirect("/");

  const sp = await searchParams;

  const typeFilter =
    sp.type && Object.values(ProductType).includes(sp.type as ProductType)
      ? (sp.type as ProductType)
      : undefined;

  const isActiveFilter =
    sp.status === "active" ? true : sp.status === "inactive" ? false : undefined;

  const products = await getAllProducts({ type: typeFilter, isActive: isActiveFilter });
  const activeCount = products.filter((p) => p.isActive).length;

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-7">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-[1.85rem] font-[600] tracking-[-0.025em] text-[#1A1410]"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Products
            </h1>
            <p
              className="mt-1 text-[0.8rem] text-[#9A8E84]"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              {products.length} product{products.length !== 1 ? "s" : ""} · {activeCount} active
            </p>
          </div>

          <ProductDialog>
            <button
              className="flex items-center gap-2 bg-[#1A1410] text-white text-[0.78rem] font-[500] tracking-[0.01em] px-4 py-2.5 rounded-[10px] hover:bg-[#302620] transition-colors shrink-0"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Product
            </button>
          </ProductDialog>
        </div>

        {/* ── Filters ── */}
        <ProductsFilters />

        {/* ── Table card ── */}
        <div
          className="rounded-2xl bg-white border border-[#E8E1D9] overflow-hidden"
          style={{ boxShadow: "0 1px 6px 0 rgba(26,20,16,0.06), 0 4px 16px -4px rgba(26,20,16,0.08)" }}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDE7DF] bg-[#FAF7F3]">
                {["SKU", "Name", "Type", "Price", "Credits", "Status", ""].map((col, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-[0.62rem] font-[700] tracking-[0.14em] uppercase text-[#B5A89C] ${
                      i === 3 || i === 6 ? "text-right" : "text-left"
                    }`}
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#F0EBE3] flex items-center justify-center">
                        <Package className="h-6 w-6 text-[#C4B5A5]" strokeWidth={1.5} />
                      </div>
                      <p
                        className="text-[0.8rem] text-[#B5A89C]"
                        style={{ fontFamily: "var(--font-raleway)" }}
                      >
                        No products found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr
                    key={product.id}
                    className={`border-b border-[#F0EBE3] last:border-0 transition-colors hover:bg-[#FDFAF7] ${
                      !product.isActive ? "opacity-60" : ""
                    }`}
                  >
                    {/* SKU */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[0.68rem] bg-[#F0EBE3] text-[#8A7E74] px-2 py-1 rounded-md">
                        {product.sku}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <span
                        className="text-[0.85rem] font-[500] text-[#1A1410]"
                        style={{ fontFamily: "var(--font-raleway)" }}
                      >
                        {product.name}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3.5">
                      {product.type === ProductType.SERVICE ? (
                        <span
                          className="inline-flex items-center rounded-full bg-[#E0EEF8] px-2.5 py-0.5 text-[0.65rem] font-[600] text-[#2E6A96] tracking-[0.04em]"
                          style={{ fontFamily: "var(--font-raleway)" }}
                        >
                          Service
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full bg-[#F5EADA] px-2.5 py-0.5 text-[0.65rem] font-[600] text-[#9B6B2A] tracking-[0.04em]"
                          style={{ fontFamily: "var(--font-raleway)" }}
                        >
                          Bundle
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="text-[0.85rem] font-[500] text-[#1A1410] tabular-nums"
                        style={{ fontFamily: "var(--font-raleway)" }}
                      >
                        {formatEgp(product.priceCents)}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className="px-4 py-3.5">
                      {product.type === ProductType.BUNDLE_CREDIT && product.creditUnits ? (
                        <span
                          className="text-[0.78rem] text-[#5A5048]"
                          style={{ fontFamily: "var(--font-raleway)" }}
                        >
                          {product.creditUnits}
                          {product.walletType ? ` ${WALLET_TYPE_LABEL[product.walletType]}` : ""}
                        </span>
                      ) : (
                        <span className="text-[#C4B5A5] text-[0.78rem]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {product.isActive ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#D8EFD8] px-2.5 py-0.5 text-[0.65rem] font-[600] text-[#2A7040] tracking-[0.04em]"
                          style={{ fontFamily: "var(--font-raleway)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3AAD5E]" />
                          Active
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#ECEAE6] px-2.5 py-0.5 text-[0.65rem] font-[600] text-[#8A8480] tracking-[0.04em]"
                          style={{ fontFamily: "var(--font-raleway)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#BBBBBB]" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <ProductDialog product={product}>
                          <button
                            className="text-[0.72rem] font-[500] text-[#5A5048] border border-[#DDD7CE] px-3 py-1.5 rounded-lg hover:bg-[#F5F0EA] hover:border-[#C9BFB4] transition-all"
                            style={{ fontFamily: "var(--font-raleway)" }}
                          >
                            Edit
                          </button>
                        </ProductDialog>
                        <ToggleActiveButton id={product.id} isActive={product.isActive} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
