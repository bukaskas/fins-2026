import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";
import heroDayUse from "@/public/images/day_use/beach2.webp";

export const metadata = buildMetadata({
  title: "Day Use",
  description:
    "Spend the day at Fins — beach, pool, food and games near Sokhna.",
  image: "/images/hero_images/dayuse_intro.webp",
  path: "/day-use",
});
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
import Reveal from "@/components/kitesurfing/Reveal";

const accent = "#38bdf8";

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
          body="Our beach kitchen is open all day, serving hand-crafted burgers, stone-baked pizza, crisp salads, and freshly squeezed juices as the sun sets over the Red Sea."
          tags={["Burgers", "Pizza", "Salads", "Fresh Juice"]}
          imageLeft={false}
          tinted
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
          tinted
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
    <div className="relative h-screen min-h-[600px] -mt-30 overflow-hidden bg-[#0c1a2e]">
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

      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a2e]/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end pb-14 px-8 md:px-14 lg:px-20">
        <div className="hero-eyebrow flex items-center gap-3 mb-5">
          <span className="block h-px w-10 flex-shrink-0" style={{ background: accent }} />
          <span
            className="text-[0.65rem] tracking-[0.35em] uppercase font-medium"
            style={{ color: "#7dd3fc" }}
          >
            Fins Beach Club &nbsp;·&nbsp; Red Sea &nbsp;·&nbsp; Sokhna
          </span>
        </div>

        <div className="mb-5">
          <h1 className="leading-none text-white">
            <span className="hero-title-1 block text-[clamp(5rem,14vw,11rem)] font-[100] tracking-[-0.02em] leading-[0.9]">
              Beach
            </span>
            <span
              className="hero-title-2 block text-[clamp(1.4rem,4vw,3.5rem)] font-[800] tracking-[0.22em] uppercase mt-1"
              style={{ color: accent }}
            >
              Day Use
            </span>
          </h1>
        </div>

        <div className="hero-divider w-20 h-px bg-white/25 mb-5" />

        <div className="hero-tags flex flex-wrap gap-2 mb-8">
          {[
            "9:00 AM – 11:00 PM",
            "From 1,500 EGP",
            "Pool · Lagoon · Lounge",
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-white/25 text-white/75 text-[0.65rem] tracking-[0.18em] uppercase backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="hero-ctas flex items-center gap-7">
          <Link
            href="/day-use/booking"
            className="group inline-flex items-center gap-2 rounded-full text-[0.7rem] font-[700] tracking-[0.14em] uppercase px-7 py-3.5 transition-opacity duration-200 hover:opacity-85"
            style={{ background: accent, color: "#0c1a2e" }}
          >
            Reserve Your Day
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
          <a
            href="#experience"
            className="text-white/60 hover:text-white text-[0.7rem] tracking-[0.25em] uppercase transition-colors duration-200"
          >
            Explore ↓
          </a>
        </div>
      </div>

      <div className="hero-side-text absolute right-7 bottom-16 hidden lg:flex flex-col items-center gap-3">
        <span className="text-white/20 text-[0.6rem] tracking-[0.5em] uppercase [writing-mode:vertical-rl]">
          Red Sea · Egypt
        </span>
        <span className="block w-px h-12 bg-white/15" />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-white text-[0.55rem] tracking-[0.35em] uppercase">
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
    <div className="bg-white border-b border-[#e0f2fe]">
      <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 py-7 md:py-9 px-8">
        {ACTIVITIES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <Icon size={22} strokeWidth={1.5} style={{ color: accent }} />
            <span className="text-gray-500 text-[0.6rem] tracking-[0.22em] uppercase">
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
  tinted?: boolean;
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
  tinted = false,
}: ExperiencePanelProps) {
  const imgOrder = imageLeft ? "" : "order-1 md:order-2";
  const txtOrder = imageLeft ? "" : "order-2 md:order-1";

  return (
    <div className="flex flex-col md:flex-row min-h-[520px] border-t border-[#e0f2fe]">
      <div className={`relative md:w-1/2 shrink-0 min-h-[340px] md:min-h-[520px] ${imgOrder}`}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div
        className={`md:w-1/2 flex flex-col justify-center px-8 md:px-14 lg:px-16 py-14 md:py-0 ${txtOrder}`}
        style={{ background: tinted ? "#f0f9ff" : "white" }}
      >
        <Reveal>
          <span
            className="block text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-4"
            style={{ color: accent }}
          >
            {eyebrow}
          </span>
          <h2 className="text-[#0c1a2e] text-[clamp(2rem,4vw,3rem)] font-[100] tracking-[-0.01em] leading-tight mb-2">
            {title}
          </h2>
          <p className="text-[#0284c7] text-sm font-[600] tracking-[0.08em] uppercase mb-6">
            {subtitle}
          </p>
          <p className="text-[#64748b] text-sm font-[300] leading-relaxed mb-8 max-w-md">
            {body}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-[#bae6fd] text-[#64748b] text-[0.6rem] tracking-[0.18em] uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>
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
    <div
      className="rounded-t-[2.5rem] md:rounded-t-[4rem]"
      style={{ background: "#0c1a2e" }}
    >
      <div className="max-w-6xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — inclusions */}
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="block h-px w-8" style={{ background: accent }} />
            <span
              className="text-[0.6rem] tracking-[0.35em] uppercase font-medium"
              style={{ color: accent }}
            >
              Day Pass
            </span>
          </div>
          <h2 className="text-white text-[clamp(1.8rem,3.5vw,2.8rem)] font-[100] tracking-[-0.01em] leading-tight mb-8">
            What&apos;s Included
          </h2>
          <ul className="space-y-4">
            {INCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="font-[700] mt-0.5 shrink-0" style={{ color: accent }}>
                  ✓
                </span>
                <span className="text-white/65 text-sm font-[300] leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Right — pricing card */}
        <Reveal delay={0.1}>
          <div
            className="p-10 flex flex-col items-start"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(56,189,248,0.3)",
            }}
          >
            <span
              className="text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-3"
              style={{ color: accent }}
            >
              Pricing
            </span>

            <div className="mb-6">
              <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase mb-1">Adults</p>
              <p className="text-white text-[clamp(2.5rem,5vw,4rem)] font-[100] leading-tight">
                1,500 EGP
              </p>
            </div>

            <div className="w-full border-t border-white/10 pt-5 mb-6 flex flex-col gap-2">
              <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase mb-1">Children</p>
              <div className="flex justify-between items-baseline">
                <span className="text-white/70 text-sm font-[300]">Ages 5 – 8</span>
                <span className="text-white font-[600] text-lg">600 EGP</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-white/70 text-sm font-[300]">Under 5</span>
                <span className="font-[700] text-sm tracking-wide" style={{ color: accent }}>
                  Free
                </span>
              </div>
            </div>

            <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-8">
              9:00 AM – 11:00 PM
            </p>
            <Link
              href="/day-use/booking"
              className="group inline-flex items-center gap-2 rounded-full text-[0.7rem] font-[700] tracking-[0.14em] uppercase px-7 py-3.5 transition-opacity duration-200 hover:opacity-85"
              style={{ background: accent, color: "#0c1a2e" }}
            >
              Reserve Your Day
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <div
      className="px-8 py-20 md:py-24 flex flex-col items-center text-center"
      style={{ background: accent, color: "#0c1a2e" }}
    >
      <Reveal className="flex flex-col items-center">
        <span className="text-[#0c1a2e]/50 text-[0.6rem] tracking-[0.35em] uppercase font-medium mb-4">
          Fins Beach Club · Red Sea · Sokhna
        </span>
        <h2 className="leading-tight tracking-[-0.01em] mb-3">
          <span className="block text-[clamp(2rem,5vw,4rem)] font-[100] leading-[0.95]">
            Ready to make
          </span>
          <span className="block text-[clamp(2rem,5vw,4rem)] font-[800] leading-[0.95]">
            a splash?
          </span>
        </h2>
        <p className="text-[#0c1a2e]/60 text-sm font-[300] max-w-md mb-10 leading-relaxed">
          Book your day pass online and arrive to a reserved sunbed, calm Red Sea
          waters, and a full day of activities waiting for you.
        </p>
        <Link
          href="/day-use/booking"
          className="group inline-flex items-center gap-2 rounded-full bg-[#0c1a2e] hover:opacity-85 text-white text-[0.7rem] font-[700] tracking-[0.14em] uppercase px-8 py-4 transition-opacity duration-200"
        >
          Reserve Your Day
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            →
          </span>
        </Link>
      </Reveal>
    </div>
  );
}
