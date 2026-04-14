"use client";

import { useEffect, useState } from "react";

export function NavScrollWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    // Set initial state in case page loads mid-scroll
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-[0_1px_24px_rgba(0,0,0,0.06)]"
          : "bg-white/10 backdrop-blur-[3px]"
      }`}
    >
      {children}
    </header>
  );
}
