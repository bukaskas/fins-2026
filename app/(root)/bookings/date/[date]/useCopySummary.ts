"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { copyText } from "@/lib/clipboard";

/** Copies the day's summary text and flags "copied" for two seconds. */
export function useCopySummary(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    const ok = await copyText(text);
    if (!ok) {
      toast.error("Couldn’t copy the summary. Your browser blocked the clipboard.");
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return { copied, copy };
}
