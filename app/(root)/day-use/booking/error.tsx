"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAVY = "#0c1a2e";
const SKY = "#38bdf8";
const MUTED = "#54657a";
const HAIRLINE = "#dbe3ec";
const TINT = "#f4f8fb";

const WHATSAPP_HREF = "https://wa.me/201222144388";

export default function DayUseBookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Day-use booking route error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: TINT }}
    >
      <div className="w-full max-w-md">
        <h1
          className="font-[family-name:var(--font-raleway)] text-[1.5rem] font-[600] tracking-[-0.01em] mb-3"
          style={{ color: NAVY }}
        >
          We couldn&apos;t load the booking form
        </h1>
        <p
          className="text-[0.875rem] leading-relaxed mb-7"
          style={{ color: MUTED }}
        >
          Nothing was booked and nothing was charged. This is on our side — try
          again, and if it keeps happening message us and we&apos;ll reserve your
          day by hand.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={reset}
            className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.2em] uppercase font-[700] rounded-full min-h-12 flex-1 hover:opacity-90 transition-opacity"
            style={{ background: SKY, color: NAVY }}
          >
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.2em] uppercase font-[700] rounded-full min-h-12 flex-1"
            style={{ borderColor: HAIRLINE, color: NAVY }}
          >
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
              Message us
            </a>
          </Button>
        </div>

        <Link
          href="/day-use"
          className="inline-block mt-6 text-[0.8125rem] underline underline-offset-4"
          style={{ color: MUTED }}
        >
          Back to Day Use
        </Link>

        {error.digest && (
          <p className="mt-8 text-[0.75rem]" style={{ color: MUTED }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
