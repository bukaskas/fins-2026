import Image, { StaticImageData } from "next/image";

/**
 * One full-bleed slide of the homepage hero. Every slide shares this markup so
 * the type floors, contrast and CTA treatment from
 * .claude/design-system/MASTER.md are fixed in one place instead of four.
 *
 * The slide is photographic, not neumorphic: the clay base and dual shadows
 * have no surface to sit on here, so only MASTER's universal rules apply —
 * 12px floor, body weight ≥ 400, 4.5:1 text, filled primary CTA, visible
 * focus, 44px targets, Lucide icons, reduced motion.
 *
 * `accent` is decoration on the dark overlay only (eyebrow rule and text, the
 * second headline line). It never fills the CTA, so every slide's action reads
 * as the same kind of button.
 */

/* Primary CTA: identical to the guest CTA on /day-use (CTA_BASE in
   app/(root)/day-use/page.tsx) and the booking form's submit — sky pill, navy
   label (≈ 9:1). A guest who clicks this lands on that form, so the button
   must look the same on both sides of the click. */
export const heroPrimaryCta =
  "group inline-flex min-h-12 items-center gap-2 rounded-full bg-[#38bdf8] px-7 text-[0.7rem] font-[700] uppercase tracking-[0.2em] text-[#0c1a2e] cursor-pointer transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a2e]";

/* Secondary link: matches the "Explore" link beside the /day-use hero CTA. */
export const heroSecondaryLink =
  "inline-flex min-h-11 items-center gap-2 px-1 text-[0.75rem] uppercase tracking-[0.2em] text-white/90 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a2e]";

type HeroSlideProps = {
  mobileSrc: StaticImageData;
  desktopSrc: StaticImageData;
  alt: string;
  accent: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Shrinks the display line for long words ("Pharaoh"). */
  compactTitle?: boolean;
  description: string;
  actions: React.ReactNode;
};

export function HeroSlide({
  mobileSrc,
  desktopSrc,
  alt,
  accent,
  eyebrow,
  title,
  subtitle,
  compactTitle = false,
  description,
  actions,
}: HeroSlideProps) {
  return (
    <div className="relative isolate h-screen overflow-hidden">
      {/* Background images */}
      <Image
        src={mobileSrc}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover sm:hidden"
      />
      <Image
        src={desktopSrc}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 hidden sm:block object-cover"
      />

      {/* Gradient layers — deep enough at the bottom that white body copy
          clears 4.5:1 over any photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Content */}
      <div className="hero-reveal absolute inset-0 flex flex-col justify-end pb-20 px-6 sm:px-8 md:px-14 lg:px-20 font-[family-name:var(--font-raleway)]">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-5">
          <span
            aria-hidden="true"
            className="h-px w-9 flex-shrink-0"
            style={{ background: accent }}
          />
          <span
            className="text-[0.75rem] font-semibold uppercase tracking-[0.28em]"
            style={{ color: accent }}
          >
            {eyebrow}
          </span>
        </div>

        {/* Headline — the thin/heavy pair is the display treatment, not body
            text, so the 400 floor doesn't apply; at this size it stays legible. */}
        <h1 className="text-white leading-none mb-5">
          <span
            className={`block font-[100] leading-[0.88] ${
              compactTitle
                ? "text-[clamp(3.5rem,10vw,8rem)] tracking-[-0.02em]"
                : "text-[clamp(4.5rem,13vw,10rem)] tracking-[-0.025em]"
            }`}
          >
            {title}
          </span>
          <span
            className="block text-[clamp(1.3rem,3.5vw,2.8rem)] font-[800] tracking-[0.22em] uppercase mt-1"
            style={{ color: accent }}
          >
            {subtitle}
          </span>
        </h1>

        {/* Description */}
        <p className="text-white/85 text-[0.95rem] md:text-base max-w-sm mb-5 font-normal leading-relaxed">
          {description}
        </p>

        <div aria-hidden="true" className="w-14 h-px bg-white/25 mb-5" />

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {actions}
        </div>
      </div>

      {/* Vertical side text — decoration, hidden from assistive tech */}
      <div
        aria-hidden="true"
        className="absolute right-6 bottom-20 hidden lg:flex flex-col items-center gap-3 pointer-events-none"
      >
        <span className="text-white/40 text-[0.75rem] tracking-[0.5em] uppercase font-[family-name:var(--font-raleway)] [writing-mode:vertical-rl]">
          Red Sea · Egypt
        </span>
        <span className="block w-px h-10 bg-white/20" />
      </div>
    </div>
  );
}
