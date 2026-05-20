"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";

type Guest = {
  name: string;
  date: Date | string;
  phone: string;
};

export function CopyGuestsButton({ guests }: { guests: Guest[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (guests.length === 0) {
      toast.error("No guests to copy");
      return;
    }

    const text = guests
      .map((g) => {
        const dateStr = format(new Date(g.date), "EEE d MMM");
        return `${g.name}, ${dateStr}, ${g.phone}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Copied ${guests.length} guest${guests.length === 1 ? "" : "s"}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Copy className="h-4 w-4 mr-1" />
      )}
      Copy Guests
    </Button>
  );
}
