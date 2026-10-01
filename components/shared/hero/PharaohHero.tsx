import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import pharaohHero from "@/public/images/pharaohs-race-hero-mobile.webp";

/**
 * Pharaohs Airstyle Competition slide. It does not go through HeroSlide: the
 * event has its own palette (navy #031E2D, amber #F8B91D, cyan #19AEE8) and a
 * navy fade instead of the shared black one, so the rider stays clear of any
 * tint in the top third.
 *
 * One portrait photo serves every breakpoint. On phones the focal point is
 * 50% 35%; on landscape viewports the crop is much tighter, so it moves up to
 * keep the rider above the copy.
 */

const NAVY_FADE =
  "linear-gradient(to bottom, rgba(3, 30, 45, 0) 30%, rgba(3, 30, 45, 0.3) 48%, rgba(3, 30, 45, 0.92) 70%, #031E2D 100%)";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7F7F4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#031E2D]";

export function PharaohHero() {
  return (
    <section
      aria-labelledby="pharaohs-hero-title"
      className="relative isolate h-full min-h-svh overflow-hidden bg-[#031E2D]"
    >
      <Image
        src={pharaohHero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[50%_35%] sm:object-[50%_20%]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: NAVY_FADE }}
      />

      <div className="hero-reveal absolute inset-0 flex flex-col justify-end px-6 pb-20 sm:px-8 md:px-14 lg:px-20 font-[family-name:var(--font-raleway)] text-[#F7F7F4]">
        {/* Eyebrow */}
        <div className="mb-5 flex items-center gap-2.5 sm:gap-3">
          <span
            aria-hidden="true"
            className="h-px w-6 flex-shrink-0 bg-[#F8B91D] sm:w-9"
          />
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#F8B91D] sm:tracking-[0.28em]">
            09 October · Kai Sokhna · Red Sea
          </p>
        </div>

        {/* Headline — thin display line over a bold amber line, as on the
            other slides; at this size the 100 weight stays legible. */}
        <h1 id="pharaohs-hero-title" className="mb-5 uppercase leading-none">
          <span className="block text-[clamp(3rem,15vw,9rem)] font-[100] leading-[0.9] tracking-[-0.02em]">
            Pharaohs
          </span>
          <span className="mt-2 block text-[clamp(0.95rem,4.3vw,2rem)] font-[800] tracking-[0.18em] text-[#F8B91D]">
            Airstyle Competition
          </span>
        </h1>

        <p className="mb-6 max-w-sm text-[0.95rem] font-normal leading-relaxed text-[#F7F7F4]/90 md:max-w-md md:text-base">
          Join us for a day packed with activities, music, flavorful bites, and
          high-flying kitesurfing tricks
        </p>

        <div aria-hidden="true" className="mb-6 h-px w-14 bg-[#F7F7F4]/25" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href="/day-use/booking/pharaoh-airstyle"
            className={`group inline-flex min-h-14 items-center gap-3 rounded-full bg-[#19AEE8] px-9 text-[0.8rem] font-[700] uppercase tracking-[0.2em] text-[#031E2D] transition-colors duration-200 hover:bg-[#45c0f0] motion-reduce:transition-none ${focusRing}`}
          >
            Reserve
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            />
          </Link>
          <a
            href="https://wa.me/201080500099?text=Hello%2C%0AI%20want%20to%20know%20more%20about%20Pharaohs%20Airstyle%20Competition"
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-[#F7F7F4] ${focusRing}`}
          >
            Contact
            <ArrowRight
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            />
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
