import Image from "next/image";
import heroDayUse from "@/public/images/day_use/beach2.webp";
import beachExperienceImage from "@/public/images/day_use/beach1.webp";
import foodExperienceImage from "@/public/images/day_use/food.webp";
import loungeExperienceImage from "@/public/images/day_use/lounge.webp";
import gamesExperienceImage from "@/public/images/day_use/games.webp";
import {
  Umbrella,
  WavesLadder,
  Wind,
  Volleyball,
  UtensilsCrossed,
  Armchair,
  Dices,
} from "lucide-react";
import Link from "next/link";
import { StaticImageData } from "next/image";

function DayUsePage() {
  return (
    <section className="font-[family-name:var(--font-raleway)]">
      <HeroSection />
      <ActivitiesStrip />

      <div id="experience" className="flex flex-col">
        <ExperiencePanel
          image={beachExperienceImage}
          imageAlt="Sandy beach at Fins Sokhna with umbrellas and sun loungers"
          eyebrow="01 · Beach"
          title="Beach Access"
          subtitle="Widest sandy beach in the Sokhna area"
          body="Sink into a cushioned sunbed on our expansive 500-metre shoreline. The calm, shallow Red Sea water makes it perfect for swimming, wading, or simply floating in the sun. Every guest receives a dedicated lounger and umbrella."
          tags={["Sunbeds", "Umbrellas", "Shallow Water", "500m of Shore"]}
          imageLeft
        />
        <ExperiencePanel
          image={foodExperienceImage}
          imageAlt="Delicious food options at Fins Sokhna restaurant"
          eyebrow="02 · Restaurant"
          title="Restaurant"
          subtitle="Fresh food, sea views"
          body="Our beach kitchen is open all day, serving hand-crafted burgers, stone-baked pizza, crisp salads, and freshly squeezed juices. Wind down with a shisha as the sun sets over the Red Sea."
          tags={["Burgers", "Pizza", "Salads", "Fresh Juice", "Shisha"]}
          imageLeft={false}
        />
        <ExperiencePanel
          image={loungeExperienceImage}
          imageAlt="Lounge area at Fins Sokhna"
          eyebrow="03 · Lounge"
          title="Lounge"
          subtitle="Unwind with a view"
          body="Escape the midday sun in our shaded lounge pavilion. Deep-cushioned seating, ambient music, and full bar service create the perfect afternoon escape — whether you want to nap, read, or socialise."
          tags={["Shaded Seating", "Music", "Bar Service"]}
          imageLeft
        />
        <ExperiencePanel
          image={gamesExperienceImage}
          imageAlt="Games and sports at Fins Sokhna"
          eyebrow="04 · Activities"
          title="Sports & Games"
          subtitle="Beach fun for everyone"
          body="Challenge friends to beach volleyball on our dedicated courts or gather around a ping-pong table. The kitesurfing school and watersports centre are right on site for those who want to hit the water."
          tags={["Volleyball", "Kitesurfing", "Ping-Pong"]}
          imageLeft={false}
        />
      </div>

      <WhatsIncluded />
      <BottomCTA />
    </section>
  );
}

export default DayUsePage;

// ─── Hero ────────────────────────────────────────────────────────────────────

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

      <Image
        src={heroDayUse}
        alt="Day Use experience at Fins Sokhna"
        className="object-cover object-center scale-[1.03]"
        fill
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end pb-14 px-8 md:px-14 lg:px-20">
        <div className="hero-eyebrow flex items-center gap-3 mb-5">
          <span className="block h-px w-10 bg-amber-400 flex-shrink-0" />
          <span className="text-amber-400 text-[0.65rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)] font-medium">
            Fins Beach Club &nbsp;·&nbsp; Red Sea &nbsp;·&nbsp; Sokhna
          </span>
        </div>

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

        <div className="hero-divider w-20 h-px bg-white/25 mb-5" />

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

        <div className="hero-ctas flex items-center gap-7">
          <Link
            href="/day-use/booking"
            className="group inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black text-sm font-[700] tracking-[0.12em] uppercase px-7 py-3 font-[family-name:var(--font-raleway)] transition-colors duration-200"
          >
            Reserve Your Day
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
          <a
            href="#experience"
            className="text-white/60 hover:text-white text-[0.7rem] tracking-[0.25em] uppercase font-[family-name:var(--font-raleway)] transition-colors duration-200"
          >
            Explore ↓
          </a>
        </div>
      </div>

      <div className="hero-side-text absolute right-7 bottom-16 hidden lg:flex flex-col items-center gap-3">
        <span className="text-white/20 text-[0.6rem] tracking-[0.5em] uppercase font-[family-name:var(--font-raleway)] [writing-mode:vertical-rl]">
          Red Sea · Egypt
        </span>
        <span className="block w-px h-12 bg-white/15" />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-white text-[0.55rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)]">
          Scroll
        </span>
        <span className="block w-px h-6 bg-white animate-pulse" />
      </div>
    </div>
  );
}

// ─── Activities Strip ─────────────────────────────────────────────────────────

const ACTIVITIES = [
  { icon: Umbrella, label: "Beach" },
  { icon: WavesLadder, label: "Pool" },
  { icon: Wind, label: "Kitesurfing" },
  { icon: Volleyball, label: "Volleyball" },
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Armchair, label: "Lounge" },
  { icon: Dices, label: "Games" },
];

function ActivitiesStrip() {
  return (
    <div className="bg-neutral-900 border-b border-white/5">
      <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 py-7 md:py-9 px-8">
        {ACTIVITIES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <Icon size={22} className="text-amber-400" strokeWidth={1.5} />
            <span className="text-white/60 text-[0.6rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Experience Panel ─────────────────────────────────────────────────────────

interface ExperiencePanelProps {
  image: StaticImageData;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  imageLeft: boolean;
}

function ExperiencePanel({
  image,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  body,
  tags,
  imageLeft,
}: ExperiencePanelProps) {
  const imgOrder = imageLeft ? "" : "order-1 md:order-2";
  const txtOrder = imageLeft ? "" : "order-2 md:order-1";

  return (
    <div className="flex flex-col md:flex-row min-h-[520px]">
      <div className={`relative md:w-1/2 shrink-0 min-h-[340px] md:min-h-[520px] ${imgOrder}`}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className={`md:w-1/2 bg-neutral-950 flex flex-col justify-center px-8 md:px-14 lg:px-16 py-14 md:py-0 ${txtOrder}`}>
        <span className="text-amber-400 text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-4">
          {eyebrow}
        </span>
        <h2 className="text-white text-[clamp(2rem,4vw,3rem)] font-[200] leading-tight mb-2">
          {title}
        </h2>
        <p className="text-amber-300 text-sm font-[600] tracking-[0.08em] uppercase mb-6">
          {subtitle}
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-md">
          {body}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-white/15 text-white/50 text-[0.6rem] tracking-[0.18em] uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── What's Included ──────────────────────────────────────────────────────────

const INCLUSIONS = [
  "Beach access with sunbed & umbrella",
  "Swimming pool access",
  "Locker & changing room",
  "Access to games & sports area",
  "Kitesurfing centre on site",
];

function WhatsIncluded() {
  return (
    <div className="bg-neutral-900">
      <div className="max-w-6xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — inclusions */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="block h-px w-8 bg-amber-400" />
            <span className="text-amber-400 text-[0.6rem] tracking-[0.35em] uppercase font-medium">
              Day Pass
            </span>
          </div>
          <h2 className="text-white text-[clamp(1.8rem,3.5vw,2.8rem)] font-[200] leading-tight mb-8">
            What&apos;s Included
          </h2>
          <ul className="space-y-4">
            {INCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-amber-400 font-[700] mt-0.5 shrink-0">
                  ✓
                </span>
                <span className="text-white/65 text-sm leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — pricing card */}
        <div className="border border-amber-400/30 bg-neutral-950 p-10 flex flex-col items-start">
          <span className="text-amber-400 text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-3">
            Pricing
          </span>

          <div className="mb-6">
            <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase mb-1">Adults</p>
            <p className="text-white text-[clamp(2.5rem,5vw,4rem)] font-[800] leading-tight">
              1,200 EGP
            </p>
          </div>

          <div className="w-full border-t border-white/10 pt-5 mb-6 flex flex-col gap-2">
            <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase mb-1">Children</p>
            <div className="flex justify-between items-baseline">
              <span className="text-white/70 text-sm">Ages 5 – 8</span>
              <span className="text-white font-[700] text-lg">600 EGP</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-white/70 text-sm">Under 5</span>
              <span className="text-amber-400 font-[700] text-sm tracking-wide">Free</span>
            </div>
          </div>

          <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-8">
            9:00 AM – 11:00 PM
          </p>
          <Link
            href="/day-use/booking"
            className="group inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black text-sm font-[700] tracking-[0.12em] uppercase px-7 py-3 transition-colors duration-200"
          >
            Reserve Your Day
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <div className="bg-amber-400 text-black px-8 py-20 md:py-24 flex flex-col items-center text-center">
      <span className="text-black/50 text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-4">
        Fins Beach Club · Red Sea · Sokhna
      </span>
      <h2 className="text-[clamp(2rem,5vw,4rem)] font-[800] leading-tight tracking-[-0.01em] mb-3">
        Ready to make a splash?
      </h2>
      <p className="text-black/60 text-sm max-w-md mb-10 leading-relaxed">
        Book your day pass online and arrive to a reserved sunbed, calm Red Sea
        waters, and a full day of activities waiting for you.
      </p>
      <Link
        href="/day-use/booking"
        className="group inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-sm font-[700] tracking-[0.12em] uppercase px-8 py-4 transition-colors duration-200"
      >
        Reserve Your Day
        <span className="group-hover:translate-x-1 transition-transform duration-200">
          →
        </span>
      </Link>
    </div>
  );
}
