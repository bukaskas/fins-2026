"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Reveals its children with a short fade + rise the first time they are
 * scrolled into view.
 *
 * The default state is visible. That is the whole point of the rewrite: this
 * component used to start every wrapped block at `opacity: 0` in CSS and rely on
 * hydration plus an IntersectionObserver to bring it back, so the first frame of
 * the page was blank until JavaScript had run. On a phone on mobile data — which
 * is how guests arrive, from a WhatsApp link — that meant an empty screen where
 * the hero should be. A failed or merely slow script must never hide content.
 *
 * Two rules follow from that:
 *
 * 1. **Nothing already on screen at load animates.** It is simply there. An
 *    entrance is for content the visitor scrolls down to; playing one for
 *    something they are already looking at is a delay, not an effect. This also
 *    means no hero anywhere on the site can be hidden by this component, whether
 *    or not it happens to be wrapped.
 * 2. **The animated state is opt-in and temporary.** `data-reveal` is applied by
 *    this component after mount and removed once the entrance has finished, so
 *    `will-change` is only ever set while an animation is actually running
 *    rather than left on every revealed element for the life of the page.
 *
 * `prefers-reduced-motion` is honoured twice over: checked here before any
 * animation is scheduled, and again in globals.css so the CSS is correct on its
 * own terms.
 */

/** Matches the transition duration in globals.css. */
const DURATION_MS = 350;

// useLayoutEffect warns when it runs during SSR, but on the client the pending
// state has to be set before the browser paints.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type RevealState = "idle" | "pending" | "shown";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("idle");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Stay visible and unanimated when the visitor asks for reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen at load — render it, don't perform it.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("pending");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setState("shown");
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Once the entrance is over, drop back to the plain visible state so the
  // compositor hint does not outlive the animation it was for.
  useEffect(() => {
    if (state !== "shown") return;
    const timer = window.setTimeout(
      () => setState("idle"),
      DURATION_MS + delay * 1000 + 60
    );
    return () => window.clearTimeout(timer);
  }, [state, delay]);

  return (
    <div
      ref={ref}
      data-reveal={state === "idle" ? undefined : state}
      className={`kite-reveal ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export default Reveal;
