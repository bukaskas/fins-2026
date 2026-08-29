"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Mobile-only booking bar. The hero CTA is the only action on the page until
 * the pricing card ~3,700px later, which on a phone is five screens with
 * nothing to tap and no price on screen. This carries both to every scroll
 * depth, in the thumb zone.
 *
 * Right padding clears the WhatsApp FAB (fixed bottom-6 right-6, ~64px), which
 * sits above this bar in the stacking order.
 */
export default function StickyReserveBar({ priceLabel }: { priceLabel: string }) {
  const [shown, setShown] = useState(false);

  // A scroll listener rather than an IntersectionObserver: this has to be
  // correct on mount too (a restored scroll position, a back navigation, an
  // in-page anchor), and IO gives no reliable callback for a target that is
  // already off-screen when observation starts.
  useEffect(() => {
    // One rect read per event, no rAF: a frame-throttled handler never runs
    // while the document is hidden, which leaves the bar stuck in whatever
    // state it mounted in.
    const measure = () => {
      const sentinel = document.getElementById("hero-end");
      setShown(sentinel ? sentinel.getBoundingClientRect().bottom < 0 : false);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c1a2e] pr-[4.75rem] transition-transform duration-300 ease-out md:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-shown={shown}
      aria-hidden={!shown}
    >
      <div className="flex items-center justify-between gap-3 py-3 pl-5">
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-[600] text-white">{priceLabel}</p>
          <p className="text-[0.8125rem] font-[400] text-[#a8bccf]">per adult, today</p>
        </div>
        <Link
          href="/day-use/booking"
          tabIndex={shown ? undefined : -1}
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#38bdf8] px-6 text-[0.7rem] font-[700] uppercase tracking-[0.2em] text-[#0c1a2e] transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a2e]"
        >
          Request
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
