"use client";

import { isPlainLeftClick, scrollToSection } from "@/lib/smooth-scroll";

/**
 * An in-page anchor that scrolls smoothly, honouring `prefers-reduced-motion`.
 *
 * Exists because `html { scroll-behavior: smooth }` was removed from globals.css
 * — it applied to every scroll on the site and ignored the motion preference.
 * Landing position still comes from the target's own `scroll-margin-top`.
 *
 * Falls through to the browser's default behaviour when the target id is absent
 * or the click is modified, so a new-tab click still works.
 */
function SectionLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        if (!scrollToSection(id)) return;

        event.preventDefault();
        window.history.replaceState(null, "", `#${id}`);
      }}
    >
      {children}
    </a>
  );
}

export default SectionLink;
