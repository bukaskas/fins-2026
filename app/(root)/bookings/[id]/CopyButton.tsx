"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({
  value,
  toastLabel = "Copied",
}: {
  value: string;
  toastLabel?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastLabel);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — try selecting manually");
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${value}`}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#ece8e3] px-5 py-4 transition-all duration-150 ease-out hover:bg-white hover:border-[#d6d0c8] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d0c8]"
    >
      <span className="font-[family-name:var(--font-roboto-mono)] text-[1.05rem] tracking-[0.06em] text-[#1a1614] tabular-nums">
        {value}
      </span>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-200 ${
          copied
            ? "bg-[#1a1614] text-white scale-105"
            : "bg-[#f5f3f0] text-[#5b5650] group-hover:bg-[#ece8e3] group-hover:text-[#1a1614]"
        }`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
      </span>
    </button>
  );
}
