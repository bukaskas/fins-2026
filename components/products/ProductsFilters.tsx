"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const TYPE_OPTIONS = [
  { value: "all",           label: "All" },
  { value: "SERVICE",       label: "Service" },
  { value: "BUNDLE_CREDIT", label: "Bundle" },
];

const STATUS_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[0.62rem] font-[600] tracking-[0.12em] uppercase text-[#B5A89C] shrink-0"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <div
        className="flex items-center bg-[#EDE7DE] rounded-[10px] p-[3px] gap-0.5"
      >
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`px-3 py-1.5 rounded-[7px] text-[0.72rem] font-[600] tracking-[0.02em] transition-all ${
                active
                  ? "bg-white text-[#1A1410]"
                  : "text-[#9A8E84] hover:text-[#1A1410]"
              }`}
              style={{
                fontFamily: "var(--font-raleway)",
                boxShadow: active
                  ? "0 1px 3px rgba(26,20,16,0.14), 0 0 0 0.5px rgba(26,20,16,0.06)"
                  : undefined,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const type   = searchParams.get("type")   ?? "all";
  const status = searchParams.get("status") ?? "all";

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val && val !== "all") {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => router.replace(`/products?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <SegmentedControl
        label="Type"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(val) => push({ type: val })}
      />
      <SegmentedControl
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(val) => push({ status: val })}
      />
    </div>
  );
}
