"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleProductActive } from "@/lib/actions/product.actions";

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleProductActive(id);
      toast.success(isActive ? "Product deactivated." : "Product activated.");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-[0.72rem] font-[500] px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
        isActive
          ? "text-[#A0522A] border-[#F0D4B8] hover:bg-[#FDF0E4] hover:border-[#E0B890]"
          : "text-[#2A7040] border-[#B8E0C4] hover:bg-[#EBF7EF] hover:border-[#90D0A8]"
      }`}
      style={{ fontFamily: "var(--font-raleway)" }}
    >
      {isPending ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
