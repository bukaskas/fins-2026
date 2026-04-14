import Image from "next/image";
import heroDayUse from "@/public/images/day_use/beach2.webp";
import beachExperienceImage from "@/public/images/day_use/beach1.webp";
import foodExperienceImage from "@/public/images/day_use/food.webp";
import loungeExperienceImage from "@/public/images/day_use/lounge.webp";
import gamesExperienceImage from "@/public/images/day_use/games.webp";
import restaurantSvg from "@/public/images/svg/lounge.svg";
import pingPongSvg from "@/public/images/svg/ping-pong.svg";
import loungeSvg from "@/public/images/svg/lounge.svg";
import swimmingPool from "@/public/images/svg/swimming-pool.svg";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function DayUsePage() {
  return (
    <section className=" font-[family-name:var(--font-raleway)] ">
      <HeroSection />

      <div id="experience" className="flex flex-col md:flex-row">
        <BeachExperienceImage />
        <FoodExperienceImage />
      </div>
      <div className="flex flex-col md:flex-row">
        <LoungeExperienceImage />
        <GamesExperienceImage />
      </div>
    </section>
  );
}

export default DayUsePage;

function HeroSection() {
  return (
    <div className="relative h-screen min-h-[600px] -mt-30 overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .hero-title-1   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.25s both; }
        .hero-title-2   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.4s both; }
        .hero-divider   { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.55s both; }
        .hero-tags      { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.65s both; }
        .hero-ctas      { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.78s both; }
        .hero-side-text { animation: fadeUp 1s cubic-bezier(.22,1,.36,1) 1s both; }
      `}</style>

      {/* Photo */}
      <Image
        src={heroDayUse}
        alt="Day Use experience at Fins Sokhna"
        className="object-cover object-center scale-[1.03]"
        fill
        priority
      />

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

      {/* Main content — bottom-left aligned */}
      <div className="absolute inset-0 flex flex-col justify-end pb-14 px-8 md:px-14 lg:px-20">

        {/* Eyebrow */}
        <div className="hero-eyebrow flex items-center gap-3 mb-5">
          <span className="block h-px w-10 bg-amber-400 flex-shrink-0" />
          <span className="text-amber-400 text-[0.65rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)] font-medium">
            Fins Beach Club &nbsp;·&nbsp; Red Sea &nbsp;·&nbsp; Sokhna
          </span>
        </div>

        {/* Headline */}
        <div className="mb-5">
          <h1 className="font-[family-name:var(--font-raleway)] leading-none text-white">
            <span className="hero-title-1 block text-[clamp(5rem,14vw,11rem)] font-[100] tracking-[-0.02em] leading-[0.9]">
              Beach
            </span>
            <span className="hero-title-2 block text-[clamp(1.4rem,4vw,3.5rem)] font-[800] tracking-[0.22em] uppercase text-amber-300 mt-1">
              Day Use
            </span>
          </h1>
        </div>

        {/* Thin rule */}
        <div className="hero-divider w-20 h-px bg-white/25 mb-5" />

        {/* Info tags */}
        <div className="hero-tags flex flex-wrap gap-2 mb-8">
          {[
            "9:00 AM – 11:00 PM",
            "From 1,200 EGP",
            "Pool · Lagoon · Lounge",
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-white/25 text-white/75 text-[0.65rem] tracking-[0.18em] uppercase backdrop-blur-sm font-[family-name:var(--font-raleway)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="hero-ctas flex items-center gap-7">
          <Link
            href="/day-use/booking"
            className="group inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black text-sm font-[700] tracking-[0.12em] uppercase px-7 py-3 font-[family-name:var(--font-raleway)] transition-colors duration-200"
          >
            Reserve Your Day
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
          <a
            href="#experience"
            className="text-white/60 hover:text-white text-[0.7rem] tracking-[0.25em] uppercase font-[family-name:var(--font-raleway)] transition-colors duration-200"
          >
            Explore ↓
          </a>
        </div>
      </div>

      {/* Vertical side text */}
      <div className="hero-side-text absolute right-7 bottom-16 hidden lg:flex flex-col items-center gap-3">
        <span className="text-white/20 text-[0.6rem] tracking-[0.5em] uppercase font-[family-name:var(--font-raleway)] [writing-mode:vertical-rl]">
          Red Sea · Egypt
        </span>
        <span className="block w-px h-12 bg-white/15" />
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-white text-[0.55rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)]">Scroll</span>
        <span className="block w-px h-6 bg-white animate-pulse" />
      </div>
    </div>
  );
}

function BeachExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="beach-photo" className="md:w-[50vw] shrink-0 relative">
        <Image
          src={beachExperienceImage}
          alt="Sandy beach at Fins Sokhna with umbrellas and sun loungers"
          className=" z-5  w-full object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Beach Access
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Widest sandy beach in Sokhna area
        </div>
      </div>
    </div>
  );
}

function FoodExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="food-photo" className="md:w-[50vw] shrink-0 relative aspect-3/2">
        <Image
          src={foodExperienceImage}
          alt="Delicious food options at Fins Sokhna restaurant including burgers, pizza, and salads"
          className=" z-5 object-[center_75%]"
          sizes="50vw"
          fill
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Restaurant
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Enjoy our burgers, pizza, and salads.
        </div>
      </div>
    </div>
  );
}

function LoungeExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="lounge-photo" className="md:w-[50vw] shrink-0 relative ">
        <Image
          src={loungeExperienceImage}
          alt="Lounge area at Fins Sokhna with comfortable seating and relaxing ambiance"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Lounge
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Amazing lounge area to relax and unwind.
        </div>
      </div>
    </div>
  );
}

function GamesExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="games-photo" className="md:w-[50vw] shrink-0 relative ">
        <Image
          src={gamesExperienceImage}
          alt="Lounge area at Fins Sokhna with comfortable seating and relaxing ambiance"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Games
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Enjoy a variety of fun games to play by the beach.
        </div>
      </div>
    </div>
  );
}

// A line that would have grey background with logos:
//  burger, <Hamburger />
// pizza, <Pizza />
// swimming pool, <WavesLadder />
//  games, <Dices />
// lounge, <Armchair />
