/**
 * Per-interaction smooth scrolling.
 *
 * Replaces the `html { scroll-behavior: smooth }` that used to sit in
 * globals.css. That rule applied to every scroll on the site — including ones
 * the user never initiated — and ignored `prefers-reduced-motion` entirely.
 * Scrolling is a vestibular trigger, so the preference is honoured here on every
 * call rather than assumed once at module load: users change it mid-session.
 *
 * Landing position comes from the target's own `scroll-margin-top`, which on the
 * kitesurfing sections is derived from `--section-scroll-mt` (see globals.css).
 * Nothing here needs to know how tall the sticky chrome is.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True when an anchor click is an ordinary in-page navigation we should take
 * over. Modified clicks (new tab, new window, download) and non-primary buttons
 * must keep the browser's own behaviour.
 */
export function isPlainLeftClick(event: React.MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * Scrolls the element with the given id into view beneath the sticky chrome.
 * Returns false when no such element exists, so callers can fall back to the
 * browser's own hash handling instead of swallowing the navigation.
 */
export function scrollToSection(
  id: string,
  { instant = false }: { instant?: boolean } = {}
): boolean {
  const el = document.getElementById(id);
  if (!el) return false;

  if (instant || prefersReducedMotion()) {
    el.scrollIntoView({ behavior: "auto", block: "start" });
    return true;
  }

  // How far we actually need to travel, accounting for the target's own
  // scroll-margin-top (which is what clears the sticky header + section nav).
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const from = window.scrollY;
  const to = from + el.getBoundingClientRect().top - margin;
  const needsMove = Math.abs(to - from) > 1;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  if (needsMove) {
    /*
     * Some environments accept a smooth scroll request and then never animate
     * it — the page simply never moves. We hit exactly this while verifying the
     * nav, and it is also reported in embedded webviews, which matters here
     * because guests arrive from WhatsApp's in-app browser. A dead navigation is
     * far worse than an unanimated one, so if nothing has moved shortly after
     * the request, complete the jump instantly.
     */
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - from) < 1) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }, 80);
  }

  return true;
}
