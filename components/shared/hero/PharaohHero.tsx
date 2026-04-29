import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import pharaohMobile from "@/public/images/hero_images/hero-mobile-pharaoh.webp";
import pharaohDesktop from "@/public/images/hero_images/hero-desktop-pharaoh.webp";

type PharaohHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function PharaohHero({
  mobileSrc = pharaohMobile,
  desktopSrc = pharaohDesktop,
}: PharaohHeroProps) {
  const accent = "#fde047";

  return (
    <div className="relative isolate h-screen overflow-hidden">
      <style>{`
        @keyframes heroContentReveal {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background images */}
      <Image
        src={mobileSrc}
        alt="Pharaoh Airstyle kitesurfing competition"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover sm:hidden"
      />
      <Image
        src={pharaohDesktop}
        alt="Pharaoh Airstyle kitesurfing competition"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 hidden sm:block object-cover"
      />

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col justify-end pb-20 px-8 md:px-14 lg:px-20"
        style={{ animation: "heroContentReveal 0.9s cubic-bezier(.22,1,.36,1) 0.15s both" }}
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-9 flex-shrink-0" style={{ background: accent }} />
          <span
            className="text-[0.62rem] tracking-[0.32em] uppercase font-[family-name:var(--font-raleway)] font-medium"
            style={{ color: accent }}
          >
            Kite Competition · 15th of May
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-raleway)] text-white leading-none mb-5">
          <span className="block text-[clamp(3.5rem,10vw,8rem)] font-[100] tracking-[-0.02em] leading-[0.88]">
            Pharaoh
          </span>
          <span
            className="block text-[clamp(1.3rem,3.5vw,2.8rem)] font-[800] tracking-[0.22em] uppercase mt-1"
            style={{ color: accent }}
          >
            Airstyle
          </span>
        </h1>

        {/* Description */}
        <p className="text-white/60 text-sm md:text-[0.9rem] max-w-sm mb-5 font-[family-name:var(--font-raleway)] font-[300] leading-relaxed">
          Watch the region's best riders push their limits on open water —
          raw speed, big air, and a crowd that goes wild.
        </p>

        <div className="w-14 h-px bg-white/20 mb-5" />

        {/* Date badge + tags row */}


        {/* CTAs */}
        <div className="flex items-center gap-7">
          <Link
            href="/kitesurfing/booking/pharaoh"
            className="group inline-flex items-center gap-2 text-black text-[0.75rem] font-[700] tracking-[0.14em] uppercase px-6 py-3 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-85"
            style={{ background: accent }}
          >
            Book Now
            <span className="group-hover:translate-x-1 transition-transform duration-200 text-sm">→</span>
          </Link>
          <Link
            href="https://wa.me/201080500099?text=Hello%2C%0AI%20want%20to%20know%20more%20about%20Pharaoh%20Airstyle"
            className="text-white/55 hover:text-white text-[0.68rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] transition-colors duration-200"
          >
            Learn more ↗
          </Link>
        </div>
      </div>

      {/* Vertical side text */}
      <div className="absolute right-6 bottom-20 hidden lg:flex flex-col items-center gap-3 pointer-events-none">
        <span className="text-white/15 text-[0.55rem] tracking-[0.5em] uppercase font-[family-name:var(--font-raleway)] [writing-mode:vertical-rl]">
          Red Sea · Egypt
        </span>
        <span className="block w-px h-10 bg-white/10" />
      </div>
    </div>
  );
}
