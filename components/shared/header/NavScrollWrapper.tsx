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
      className={`sticky top-0 w-full z-50 backdrop-blur-md transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-neu-base/85 shadow-neu-sm"
          : "bg-neu-base/60"
      }`}
    >
      {children}
    </header>
  );
}
