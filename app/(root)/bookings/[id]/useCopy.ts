"use client";

import * as React from "react";
import { toast } from "sonner";

/** Clipboard write with a short-lived "copied" flag and the page's toast feedback. */
export function useCopy(toastLabel: string) {
  const [copied, setCopied] = React.useState(false);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastLabel);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — try selecting manually");
    }
  };

  return { copied, copy };
}
