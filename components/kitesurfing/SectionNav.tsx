"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BookCourseLink from "@/components/kitesurfing/BookCourseLink";
import { isPlainLeftClick, scrollToSection } from "@/lib/smooth-scroll";

/**
 * The sticky section nav for /kitesurfing.
 *
 * It is a client component for three reasons, all of which used to be bugs:
 *
 * 1. **Offsets are measured, not hardcoded.** The nav sits under the site
 *    header, whose height changes across three breakpoints. Those heights were
 *    previously three magic numbers (96/104/114) duplicated from the header's
 *    own markup, with a fourth number — `scroll-mt-40`, 160px — guessing the
 *    combined stack and landing 10px short, so every anchor put its heading
 *    under the nav. Now the header and this nav are measured at runtime and
 *    written to `--header-h` / `--section-nav-h`; `--sticky-stack` and
 *    `--section-scroll-mt` derive from them (see globals.css). Resizing the logo
 *    corrects the offsets instead of silently breaking them.
 *
 * 2. **Scrolling is per interaction.** `html { scroll-behavior: smooth }` used
 *    to be declared globally, which ignored `prefers-reduced-motion`. Clicks go
 *    through `scrollToSection`, which honours it per call.
 *
 * 3. **The nav reports position.** It previously offered four destinations and
 *    never said which one you were in.
 */

const SECTIONS = [
  { id: "courses", label: "Courses" },
  { id: "rental", label: "Gear Rental" },
  { id: "storage", label: "Storage" },
  { id: "member", label: "Beach Access" },
] as const;

const IDS = SECTIONS.map((s) => s.id) as readonly string[];

function SectionNav() {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Measure the real sticky chrome and publish it as custom properties. The CSS
     defaults in globals.css keep the offsets correct before this runs. */
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector("header");
    const nav = navRef.current;

    const measure = () => {
      const headerH = header?.getBoundingClientRect().height ?? 0;
      const navH = nav?.getBoundingClientRect().height ?? 0;
      if (headerH > 0) root.style.setProperty("--header-h", `${headerH}px`);
      if (navH > 0) root.style.setProperty("--section-nav-h", `${navH}px`);
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (nav) observer.observe(nav);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      // Don't leak this page's measurements into the next route.
      root.style.removeProperty("--header-h");
      root.style.removeProperty("--section-nav-h");
    };
  }, []);

  /* Scroll-spy. The active section is the last one whose top has passed under
     the sticky stack; at the very bottom of the page the last section wins, so a
     short final section can still be reached. */
  useEffect(() => {
    /*
     * Reads four rects per scroll event and writes nothing, so there is no
     * forced reflow; Chrome already delivers scroll events at most once a frame.
     * A requestAnimationFrame throttle was tried here and removed: it adds a
     * latch (if the frame never runs, the guard stays set and the nav silently
     * stops reporting) in exchange for no measurable saving.
     */
    const update = () => {
      // Guard on scrollY so a short first paint can't read as "at the bottom".
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;

      if (atBottom) {
        setActiveId(IDS[IDS.length - 1]);
        return;
      }

      /*
       * Measure against each section's own scroll-margin-top, not against the
       * header + nav heights. A section scrolled to via an anchor comes to rest
       * at exactly its scroll-margin — which is the stack plus a 2px gap — so
       * comparing to the raw stack left it 2px short of counting as arrived and
       * credited the previous section instead. The click handler was setting
       * state directly, which hid this until a scroll recomputed it.
       */
      let current: string | null = null;
      for (const id of IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const line = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        if (el.getBoundingClientRect().top - line <= 1) current = id;
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  /* Keep the active tab visible in the horizontally scrolling list without ever
     touching the page's vertical scroll. */
  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;

    const tab = list.querySelector<HTMLElement>(`[data-section="${activeId}"]`);
    if (!tab) return;

    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const viewLeft = list.scrollLeft;
    const viewRight = viewLeft + list.clientWidth;

    if (left < viewLeft) {
      list.scrollTo({ left: left - 16, behavior: "smooth" });
    } else if (right > viewRight) {
      list.scrollTo({ left: right - list.clientWidth + 16, behavior: "smooth" });
    }
  }, [activeId]);

  /* A deep link from the footer (/kitesurfing#courses) lands before images and
     the scroll reveals have settled, so the browser's own hash scroll can end up
     well short. Re-assert the position once layout is stable. */
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!IDS.includes(id)) return;

    const timer = window.setTimeout(() => {
      scrollToSection(id, { instant: true });
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      // Let modified clicks (new tab, download, …) behave normally.
      if (!isPlainLeftClick(event)) return;
      if (!scrollToSection(id)) return; // No such section — let the browser try.

      event.preventDefault();
      setActiveId(id);
      // Keep the URL shareable without triggering a second, unoffset jump.
      window.history.replaceState(null, "", `#${id}`);
    },
    []
  );

  return (
    <nav
      ref={navRef}
      aria-label="Kitesurfing sections"
      className="sticky top-[var(--header-h)] z-40 bg-neu-base/90 backdrop-blur-md shadow-neu-sm"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 flex items-center justify-between gap-6 py-1.5">
        <span className="hidden md:block text-[0.85rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[-0.01em] text-neu-fg">
          Kitesurfing
        </span>

        {/* Below md the four tabs need 433px in a 212px rail, so the list always
            scrolls there and previously gave no sign of it — the last tab simply
            ended at the edge. The fade says there is more to the right; from md
            the rail fits and the mask is removed so nothing is dimmed for show. */}
        <ul
          ref={listRef}
          className="flex items-center gap-6 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] md:gap-9 md:[mask-image:none]"
        >
          {SECTIONS.map(({ id, label }) => {
            const isActive = activeId === id;
            return (
              <li key={id} className="flex-shrink-0">
                <a
                  href={`#${id}`}
                  data-section={id}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => handleClick(event, id)}
                  className={`group flex min-h-[44px] flex-col justify-center gap-0.5 text-[0.75rem] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-colors duration-200 ${
                    isActive
                      ? "text-neu-primary-ink"
                      : "text-neu-muted hover:text-neu-primary-ink"
                  }`}
                >
                  {label}
                  <span
                    aria-hidden="true"
                    className={`h-px bg-neu-primary transition-all duration-300 ease-out ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* "Book a course" is 185px against 82px for "Book". In a 390px bar the
            tab scroller only has ~239px to begin with, so the long form is held
            back until there is room for it. */}
        <BookCourseLink className="neu-btn inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full bg-neu-primary text-neu-fg text-[0.75rem] font-[600] tracking-[0.16em] uppercase px-5 font-[family-name:var(--font-raleway)] shadow-neu-sm">
          <span>
            Book<span className="hidden sm:inline"> a course</span>
          </span>
        </BookCourseLink>
      </div>
    </nav>
  );
}

export default SectionNav;
