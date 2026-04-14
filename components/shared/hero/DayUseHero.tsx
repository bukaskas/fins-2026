import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import dayUseMobile from "@/public/images/hero_images/hero_mobile1.webp";
import dayUseDesktop from "@/public/images/hero_images/hero_desktop1.webp";

type DayUseHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function DayUseHero({
  mobileSrc = dayUseMobile,
  desktopSrc = dayUseDesktop,
}: DayUseHeroProps) {
  const accent = "#fbbf24";

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
        alt="Day use beach at Fins Sokhna"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover sm:hidden"
      />
      <Image
        src={desktopSrc}
        alt="Day use beach at Fins Sokhna"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 hidden sm:block object-cover"
      />

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

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
            Beach Club · Sokhna · Red Sea
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-raleway)] text-white leading-none mb-5">
          <span className="block text-[clamp(4.5rem,13vw,10rem)] font-[100] tracking-[-0.025em] leading-[0.88]">
            Beach
          </span>
          <span
            className="block text-[clamp(1.3rem,3.5vw,2.8rem)] font-[800] tracking-[0.22em] uppercase mt-1"
            style={{ color: accent }}
          >
            Day Use
          </span>
        </h1>

        {/* Description */}
        <p className="text-white/60 text-sm md:text-[0.9rem] max-w-sm mb-5 font-[family-name:var(--font-raleway)] font-[300] leading-relaxed">
          Amazing food, soft sand, activities and more. Everything you need
          for a perfect day out on the Red Sea.
        </p>

        <div className="w-14 h-px bg-white/20 mb-5" />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["9:00 AM – 11:00 PM", "From 1,200 EGP", "Pool · Lounge · Beach"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-[5px] border border-white/20 text-white/55 text-[0.58rem] tracking-[0.16em] uppercase font-[family-name:var(--font-raleway)] backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-7">
          <Link
            href="/day-use/booking"
            className="group inline-flex items-center gap-2 text-black text-[0.75rem] font-[700] tracking-[0.14em] uppercase px-6 py-3 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-85"
            style={{ background: accent }}
          >
            Reserve Your Day
            <span className="group-hover:translate-x-1 transition-transform duration-200 text-sm">→</span>
          </Link>
          <Link
            href="/day-use"
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
