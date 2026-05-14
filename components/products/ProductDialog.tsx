"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { ProductType, WalletType, WalletUnit } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  priceCents: number;
  creditUnits: number | null;
  creditValidDays: number | null;
  walletType: WalletType | null;
  walletUnit: WalletUnit | null;
};

type Props = {
  children: React.ReactNode;
  product?: Product;
};

const raleway = { fontFamily: "var(--font-raleway)" } as const;

export function ProductDialog({ children, product }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType>(
    product?.type ?? ProductType.SERVICE
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!product;

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) setSelectedType(product?.type ?? ProductType.SERVICE);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result.success) {
      toast.success(isEdit ? "Product updated." : "Product created.");
      setOpen(false);
      formRef.current?.reset();
      setSelectedType(ProductType.SERVICE);
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  const inputBase =
    "w-full rounded-[10px] border border-[#DDD7CE] bg-white px-3.5 py-2.5 text-[0.84rem] text-[#1A1410] placeholder:text-[#C4B5A5] focus:outline-none focus:border-[#7EC8C8] transition-all";
  const inputStyle = { fontFamily: "var(--font-raleway)", ...({ "--tw-ring-color": "rgba(126,200,200,0.2)" } as any) };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-[#E5DDD4]" style={{ borderRadius: "18px", boxShadow: "0 24px 80px -8px rgba(26,20,16,0.22), 0 4px 16px -4px rgba(26,20,16,0.1)" }}>

        {/* ── Dialog header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-[#EDE7DF] bg-[#FDFAF7]">
          <DialogHeader className="space-y-0">
            <DialogTitle
              className="text-[0.95rem] font-[600] tracking-[-0.01em] text-[#1A1410]"
              style={raleway}
            >
              {isEdit ? "Edit Product" : "New Product"}
            </DialogTitle>
            {isEdit && (
              <p className="mt-1 text-[0.7rem] text-[#B5A89C]" style={raleway}>
                SKU · <span className="font-mono">{product.sku}</span>
              </p>
            )}
          </DialogHeader>
        </div>

        {/* ── Form ── */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4 bg-white">

          {/* SKU — only on create */}
          {!isEdit && (
            <div>
              <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                SKU
              </label>
              <input
                name="sku"
                required
                className={inputBase}
                style={inputStyle}
                placeholder="e.g. SURF-001"
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
              Name
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              required
              className={inputBase}
              style={inputStyle}
              placeholder="Product name"
            />
          </div>

          {/* Type + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                Type
              </label>
              <select
                name="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ProductType)}
                required
                className={inputBase}
                style={inputStyle}
              >
                <option value={ProductType.SERVICE}>Service</option>
                <option value={ProductType.BUNDLE_CREDIT}>Bundle Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                Price (EGP)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={product ? product.priceCents / 100 : undefined}
                step="0.01"
                min="0"
                required
                className={inputBase}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Bundle settings */}
          {selectedType === ProductType.BUNDLE_CREDIT && (
            <div className="rounded-[12px] border border-[#EAE4DC] bg-[#FAF6F1] p-4 space-y-3">
              <p
                className="text-[0.58rem] font-[800] tracking-[0.18em] uppercase text-[#C4955A]"
                style={raleway}
              >
                Bundle Settings
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                    Credit Units
                  </label>
                  <input
                    type="number"
                    name="creditUnits"
                    defaultValue={product?.creditUnits ?? undefined}
                    min="1"
                    required
                    className={inputBase}
                    style={inputStyle}
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                    Valid Days
                  </label>
                  <input
                    type="number"
                    name="creditValidDays"
                    defaultValue={product?.creditValidDays ?? undefined}
                    min="1"
                    className={inputBase}
                    style={inputStyle}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                    Wallet Type
                  </label>
                  <select
                    name="walletType"
                    defaultValue={product?.walletType ?? ""}
                    required
                    className={inputBase}
                    style={inputStyle}
                  >
                    <option value="" disabled>Select…</option>
                    <option value={WalletType.BEACH_USE}>Beach Use</option>
                    <option value={WalletType.LESSON_HOURS}>Lesson Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.62rem] font-[700] tracking-[0.12em] uppercase text-[#9A8E84] mb-1.5" style={raleway}>
                    Wallet Unit
                  </label>
                  <select
                    name="walletUnit"
                    defaultValue={product?.walletUnit ?? ""}
                    required
                    className={inputBase}
                    style={inputStyle}
                  >
                    <option value="" disabled>Select…</option>
                    <option value={WalletUnit.ENTRY}>Entry</option>
                    <option value={WalletUnit.HOUR}>Hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[0.78rem] font-[500] text-[#8A7E74] px-4 py-2.5 rounded-[10px] hover:bg-[#F5F0EA] transition-colors"
              style={raleway}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[0.78rem] font-[500] bg-[#1A1410] text-white px-5 py-2.5 rounded-[10px] hover:bg-[#302620] transition-colors"
              style={raleway}
            >
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
