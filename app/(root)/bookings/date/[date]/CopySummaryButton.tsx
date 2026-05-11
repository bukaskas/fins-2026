"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  text: string;
};

export function CopySummaryButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 border border-[#ece8e3] bg-white text-[#6b6460] font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.12em] uppercase font-[600] px-3.5 py-2 rounded-full hover:border-[#d6d0c8] hover:text-[#1a1614] transition-colors duration-150 shrink-0"
    >
      {copied ? (
        <Check className="h-3 w-3 text-[#22c55e]" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Copy summary"}
    </button>
  );
}
