"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      Save as PDF
    </Button>
  );
}
