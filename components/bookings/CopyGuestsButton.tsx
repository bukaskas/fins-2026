"use client";

import { useState, useTransition } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";

export type Guest = {
  name: string;
  date: Date | string;
  phone: string;
};

/**
 * Shared clipboard logic so the desktop button and the mobile dropdown item
 * behave identically.
 *
 * `loadGuests` fetches the full filtered set from the server — the rendered
 * list is only the first page, so copying from it would silently truncate.
 */
export function useCopyGuests(loadGuests: () => Promise<Guest[]>) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const copyGuests = () => {
    startTransition(async () => {
      let guests: Guest[];
      try {
        guests = await loadGuests();
      } catch {
        toast.error("Failed to load guests");
        return;
      }

      if (guests.length === 0) {
        toast.error("No guests to copy");
        return;
      }

      const text = guests
        .map((g) => `${g.name}, ${format(new Date(g.date), "EEE d MMM")}, ${g.phone}`)
        .join("\n");

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`Copied ${guests.length} guest${guests.length === 1 ? "" : "s"}`);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    });
  };

  return { copied, isPending, copyGuests };
}

export function CopyGuestsButton({
  loadGuests,
  label,
}: {
  loadGuests: () => Promise<Guest[]>;
  label: string;
}) {
  const { copied, isPending, copyGuests } = useCopyGuests(loadGuests);

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={copyGuests}
      disabled={isPending}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Copy className="h-4 w-4 mr-1" />
      )}
      {isPending ? "Copying…" : label}
    </Button>
  );
}
