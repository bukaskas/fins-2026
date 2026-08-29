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
  UtensilsCrossed,
  Armchair,
  Dices,
  Check,
  ArrowRight,
  ArrowDown,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { StaticImageData } from "next/image";
import Reveal from "@/components/kitesurfing/Reveal";
import StickyReserveBar from "./StickyReserveBar";
import { getClosedDates } from "@/lib/actions/closedDate.actions";
import { formatEGP, getDayUseRates, getUpcomingHolidayDates } from "@/lib/pricing";
import { LOCATION_ADDRESS, WHATSAPP_PHONE } from "@/lib/constants";

/* ─────────────────────────────────────────────────────────────
   Visual world — see .claude/design-system/pages/day-use.md,
   which overrides MASTER.md for everything under /day-use.
   ───────────────────────────────────────────────────────────── */
const NAVY = "#0c1a2e";
const SKY = "#38bdf8";
const accent = SKY;
// Darkened sky pair. Saturated #38bdf8 is 2.0:1 on white — it is an accent for
// navy grounds only, never eyebrow text on a light one.
const SKY_INK = "#0369a1";
const MUTED = "#54657a"; // navy-tinted slate, 5.3:1 on white
const ON_NAVY = "#a8bccf"; // navy-tinted slate for secondary text on navy, 7.8:1
const TINT = "#f0f9ff";
const HAIRLINE = "#e0f2fe";

const WHATSAPP_HREF = "https://wa.me/20" + WHATSAPP_PHONE.replace(/^0/, "");

// Shared CTA treatment. day-use.md: sky fill, navy label, rounded-full,
// uppercase, tracking-[0.2em], weight 700, min-h-12.
const CTA_BASE =
  "group inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-[0.7rem] font-[700] uppercase tracking-[0.2em] transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

/** Today in Africa/Cairo, normalised to the UTC midnight that keys rates and closed dates. */
function cairoToday(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

async function DayUsePage() {
  const today = cairoToday();
  const rates = getDayUseRates(today);
  const upcomingHolidays = getUpcomingHolidayDates(today);

  // Public page: if the availability lookup fails, the page still renders and
  // simply says nothing about today rather than guessing.
  const closed = await getClosedDates(today, today);
  const isFullToday =
    closed.success && closed.data.some((row) => row.date.getTime() === today.getTime());
  const availabilityKnown = closed.success;

  return (
    <section className="font-[family-name:var(--font-raleway)]">
      <HeroSection adultPriceLabel={formatEGP(rates.adultUnitCents)} />
      {/* Sticky-bar sentinel. Needs a real height: IntersectionObserver never
          fires for a zero-area target, which leaves the bar permanently hidden. */}
      <div id="hero-end" aria-hidden="true" className="h-px" />

      <TodayAtFins
        today={today}
        rates={rates}
        isFull={isFullToday}
        availabilityKnown={availabilityKnown}
      />

      <ActivitiesStrip />

      <div id="experience" className="flex flex-col">
        <ExperiencePanel
          id="beach"
          image={beachExperienceImage}
          imageAlt="Sandy beach at Fins Sokhna with umbrellas and sun loungers"
          eyebrow="Beach"
          title="Beach Access"
          subtitle="Shallow water, no drop-off"
          body="Sink into a cushioned sunbed on the shoreline. The water stays calm and shallow a long way out, so it suits swimming, wading and small children. Every guest gets a lounger and an umbrella."
          tags={["Sunbeds", "Umbrellas", "Shallow Water"]}
          imageLeft
        />
        <ExperiencePanel
          id="restaurant"
          image={foodExperienceImage}
          imageAlt="Delicious food options at Fins Sokhna restaurant"
          eyebrow="Restaurant"
          title="Restaurant"
          subtitle="Open all day, charged separately"
          body="The beach kitchen runs all day: burgers, stone-baked pizza, salads and fresh juice. Order at your sunbed or eat looking out at the water. Food and drinks are not part of the day pass."
          tags={["Burgers", "Pizza", "Salads", "Fresh Juice"]}
          imageLeft={false}
          tinted
        />
        <ExperiencePanel
          id="lounge"
          image={loungeExperienceImage}
          imageAlt="Lounge area at Fins Sokhna"
          eyebrow="Lounge"
          title="Lounge"
          subtitle="Shade for the middle of the day"
          body="A covered pavilion with deep seating and bar service, for the hours when the sun is directly overhead. Somewhere to nap, read or sit with a drink."
          tags={["Shaded Seating", "Music", "Bar Service"]}
          imageLeft
        />
        <ExperiencePanel
          id="sports"
          image={gamesExperienceImage}
          imageAlt="Games and sports at Fins Sokhna"
          eyebrow="Sports & Games"
          title="Sports & Games"
          subtitle="Courts and tables, free to use"
          body="Beach volleyball on the courts, ping-pong under cover, and games to borrow at the desk. All of it is included in the day pass."
          tags={["Volleyball", "Ping-Pong", "Beach Games"]}
          imageLeft={false}
          tinted
        />
      </div>

      <WhatsIncluded rates={rates} upcomingHolidays={upcomingHolidays} />
      <BottomCTA />

      <StickyReserveBar priceLabel={formatEGP(rates.adultUnitCents)} />
    </section>
  );
}

export default DayUsePage;

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({ adultPriceLabel }: { adultPriceLabel: string }) {
  return (
    <div className="relative h-screen min-h-[600px] -mt-30 overflow-hidden bg-[#0c1a2e]">
      {/* Entrance animation is opt-in: with reduced motion the elements simply
          render in place, matching how .kite-reveal degrades in globals.css. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .hero-eyebrow   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.1s both; }
          .hero-title-1   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.25s both; }
          .hero-title-2   { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.4s both; }
          .hero-divider   { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.5s both; }
          .hero-tags      { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.58s both; }
          .hero-ctas      { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.66s both; }
        }
      `}</style>

      <Image
        src={heroDayUse}
        alt="The beach at Fins Sokhna at the water's edge"
        className="object-cover object-center scale-[1.03]"
        fill
        priority
        placeholder="blur"
        sizes="100vw"
      />

      {/* Enough scrim to hold white text clear of 4.5:1 over bright sand, and
          no more — the photograph is the reason anyone stays on this page. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a2e]/90 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end pb-14 px-8 md:px-14 lg:px-20">
        <div className="hero-eyebrow flex items-center gap-3 mb-5">
          <span className="block h-px w-10 flex-shrink-0" style={{ background: accent }} />
          <span className="text-[0.7rem] tracking-[0.2em] uppercase font-[700] text-white">
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

        <div className="hero-divider w-20 h-px bg-white/30 mb-5" />

        <div className="hero-tags flex flex-wrap gap-2 mb-8">
          {[
            "9:00 AM – 11:00 PM",
            `From ${adultPriceLabel}`,
            "Beach · Pool · Lounge",
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 border border-white/40 text-white text-[0.75rem] tracking-[0.12em] uppercase backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="hero-ctas flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href="/day-use/booking"
            className={`${CTA_BASE} focus-visible:ring-[#38bdf8] focus-visible:ring-offset-[#0c1a2e]`}
            style={{ background: accent, color: NAVY }}
          >
            Request your day
            <ArrowRight
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
          <a
            href="#experience"
            className="inline-flex min-h-11 items-center gap-2 px-1 text-[0.75rem] tracking-[0.2em] uppercase text-white/90 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a2e]"
          >
            Explore
            <ArrowDown size={14} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Today at Fins ────────────────────────────────────────────────────────────

/**
 * This page is reached by QR at the gate, so the first thing under the hero
 * answers the questions someone standing outside actually has: what does today
 * cost, is today still open, and where am I. ClosedDate is the same source the
 * 80-person auto-close writes to, so "fully booked" here is real.
 */
function TodayAtFins({
  today,
  rates,
  isFull,
  availabilityKnown,
}: {
  today: Date;
  rates: { adultUnitCents: number; kidsUnitCents: number; rateType: string };
  isFull: boolean;
  availabilityKnown: boolean;
}) {
  return (
    <div className="border-b bg-white" style={{ borderColor: HAIRLINE }}>
      <div className="mx-auto max-w-6xl px-8 py-10 md:px-14 lg:px-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <span
              className="mb-3 block text-[0.7rem] font-[700] uppercase tracking-[0.2em]"
              style={{ color: SKY_INK }}
            >
              Today · {formatDay(today)}
            </span>

            <p className="text-[1.75rem] font-[200] leading-tight" style={{ color: NAVY }}>
              {formatEGP(rates.adultUnitCents)}{" "}
              <span className="text-[0.9375rem] font-[600]" style={{ color: MUTED }}>
                per adult
              </span>
            </p>
            <p className="mt-1 text-[0.875rem] font-[400]" style={{ color: MUTED }}>
              {formatEGP(rates.kidsUnitCents)} ages 5–8 · under 5 free
              {rates.rateType === "holiday" && " · holiday rate"}
              {rates.rateType === "discounted" && " · discounted rate"}
            </p>

            {availabilityKnown && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-[600]"
                 style={
                   isFull
                     ? { background: "#fffbeb", color: "#b45309" }
                     : { background: TINT, color: SKY_INK }
                 }>
                <span
                  className="block size-2 shrink-0 rounded-full"
                  style={{ background: isFull ? "#f59e0b" : "#0284c7" }}
                  aria-hidden="true"
                />
                {isFull ? "Fully booked today — ask about tomorrow" : "Taking bookings for today"}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <a
              href={LOCATION_ADDRESS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-[600] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2"
              style={{ color: NAVY }}
            >
              <MapPin size={16} strokeWidth={2} aria-hidden="true" style={{ color: SKY_INK }} />
              Open in Google Maps
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-[600] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2"
              style={{ color: NAVY }}
            >
              <MessageCircle size={16} strokeWidth={2} aria-hidden="true" style={{ color: SKY_INK }} />
              Message the desk on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activities Strip ─────────────────────────────────────────────────────────

// One entry per panel below, so the page states its contents once rather than
// in four lists that disagree.
const ACTIVITIES: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Umbrella, label: "Beach", href: "#beach" },
  { icon: UtensilsCrossed, label: "Restaurant", href: "#restaurant" },
  { icon: Armchair, label: "Lounge", href: "#lounge" },
  { icon: Dices, label: "Sports & Games", href: "#sports" },
];

function ActivitiesStrip() {
  return (
    <div className="bg-white border-b" style={{ borderColor: HAIRLINE }}>
      <div className="flex flex-wrap justify-center gap-4 md:gap-10 lg:gap-14 py-6 md:py-8 px-6">
        {ACTIVITIES.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="flex min-h-11 min-w-24 flex-col items-center justify-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[#f0f9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2"
          >
            <Icon size={22} strokeWidth={1.5} style={{ color: SKY_INK }} aria-hidden="true" />
            <span
              className="text-[0.75rem] tracking-[0.12em] uppercase font-[600] text-center"
              style={{ color: MUTED }}
            >
              {label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Experience Panel ─────────────────────────────────────────────────────────

interface ExperiencePanelProps {
  id: string;
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
  id,
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
  // Below md the desktop order utilities do nothing, which left four identical
  // image-then-text blocks in a row. Alternating the column direction gives the
  // phone layout the same rhythm the desktop one has.
  const stack = imageLeft ? "flex-col" : "flex-col-reverse";
  const imgOrder = imageLeft ? "" : "md:order-2";
  const txtOrder = imageLeft ? "" : "md:order-1";

  return (
    <div
      id={id}
      className={`flex ${stack} md:flex-row min-h-[520px] border-t scroll-mt-20`}
      style={{ borderColor: HAIRLINE }}
    >
      <div className={`relative md:w-1/2 shrink-0 min-h-[340px] md:min-h-[520px] ${imgOrder}`}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          placeholder="blur"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div
        className={`md:w-1/2 flex flex-col justify-center px-8 md:px-14 lg:px-16 py-14 md:py-16 ${txtOrder}`}
        style={{ background: tinted ? TINT : "white" }}
      >
        <Reveal>
          <span
            className="block text-[0.7rem] tracking-[0.2em] uppercase font-[700] mb-4"
            style={{ color: SKY_INK }}
          >
            {eyebrow}
          </span>
          <h2
            className="text-[clamp(2rem,4vw,3rem)] font-[100] tracking-[-0.01em] leading-tight mb-2"
            style={{ color: NAVY }}
          >
            {title}
          </h2>
          <p
            className="text-[0.9375rem] font-[600] tracking-[0.08em] uppercase mb-6"
            style={{ color: SKY_INK }}
          >
            {subtitle}
          </p>
          <p
            className="text-[0.9375rem] font-[400] leading-relaxed mb-8 max-w-[65ch]"
            style={{ color: MUTED }}
          >
            {body}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 border text-[0.75rem] tracking-[0.12em] uppercase font-[600]"
                style={{ borderColor: "#bae6fd", color: MUTED }}
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
];

function WhatsIncluded({
  rates,
  upcomingHolidays,
}: {
  rates: { adultUnitCents: number; kidsUnitCents: number; rateType: string };
  upcomingHolidays: Date[];
}) {
  return (
    <div className="rounded-t-[2.5rem] md:rounded-t-[4rem]" style={{ background: NAVY }}>
      <div className="max-w-6xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — inclusions */}
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="block h-px w-8" style={{ background: accent }} />
            <span
              className="text-[0.7rem] tracking-[0.2em] uppercase font-[700]"
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
                <Check
                  size={18}
                  strokeWidth={2.5}
                  className="mt-0.5 shrink-0"
                  style={{ color: accent }}
                  aria-hidden="true"
                />
                <span className="text-[0.9375rem] font-[400] leading-relaxed" style={{ color: ON_NAVY }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-6 border-t border-white/10 pt-5 text-[0.875rem] font-[400] leading-relaxed"
            style={{ color: ON_NAVY }}
          >
            Food and drinks from the restaurant and bar are charged separately.
          </p>
        </Reveal>

        {/* Right — pricing. Deliberately outside Reveal: the price must never be
            the thing that renders blank on a fast scroll. */}
        <div
          className="p-10 flex flex-col items-start"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${SKY}66` }}
        >
          <span
            className="text-[0.7rem] tracking-[0.2em] uppercase font-[700] mb-3"
            style={{ color: accent }}
          >
            Pricing
          </span>

          <div className="mb-6">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase font-[700] mb-1" style={{ color: ON_NAVY }}>
              Adults
            </p>
            <p className="text-white text-[clamp(2.5rem,5vw,4rem)] font-[200] leading-tight">
              {formatEGP(rates.adultUnitCents)}
            </p>
          </div>

          <div className="w-full border-t border-white/15 pt-5 mb-6 flex flex-col gap-2">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase font-[700] mb-1" style={{ color: ON_NAVY }}>
              Children
            </p>
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-[0.9375rem] font-[400]" style={{ color: ON_NAVY }}>
                Ages 5 – 8
              </span>
              <span className="text-white font-[600] text-[1.125rem]">
                {formatEGP(rates.kidsUnitCents)}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-[0.9375rem] font-[400]" style={{ color: ON_NAVY }}>
                Under 5
              </span>
              <span className="font-[700] text-[0.9375rem] tracking-wide" style={{ color: accent }}>
                Free
              </span>
            </div>
          </div>

          {upcomingHolidays.length > 0 && (
            <p className="mb-6 text-[0.8125rem] font-[400] leading-relaxed" style={{ color: ON_NAVY }}>
              Holiday rate applies on{" "}
              {upcomingHolidays.map((d) => formatDay(d).replace(/^\w+, /, "")).join(", ")}.
            </p>
          )}

          <p className="text-[0.8125rem] tracking-[0.12em] uppercase font-[600] mb-8" style={{ color: ON_NAVY }}>
            9:00 AM – 11:00 PM
          </p>

          <Link
            href="/day-use/booking"
            className={`${CTA_BASE} w-full justify-center focus-visible:ring-[#38bdf8] focus-visible:ring-offset-[#0c1a2e]`}
            style={{ background: accent, color: NAVY }}
          >
            Request your day
            <ArrowRight
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
          <p className="mt-4 text-[0.8125rem] font-[400] leading-relaxed" style={{ color: ON_NAVY }}>
            No payment now — we&apos;ll confirm on WhatsApp, usually within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <div className="px-8 py-20 md:py-24 flex flex-col items-center text-center" style={{ background: accent }}>
      <Reveal className="flex flex-col items-center">
        <span
          className="text-[0.7rem] tracking-[0.2em] uppercase font-[700] mb-4"
          style={{ color: NAVY }}
        >
          Fins Beach Club · Red Sea · Sokhna
        </span>
        <h2 className="leading-tight tracking-[-0.01em] mb-3" style={{ color: NAVY }}>
          <span className="block text-[clamp(2rem,5vw,4rem)] font-[100] leading-[0.95]">
            Spend the day
          </span>
          <span className="block text-[clamp(2rem,5vw,4rem)] font-[800] leading-[0.95]">
            at Fins.
          </span>
        </h2>
        <p
          className="text-[0.9375rem] font-[400] max-w-md mb-10 leading-relaxed"
          style={{ color: NAVY }}
        >
          Ask for a day pass and arrive to a reserved sunbed, calm water and the
          run of the beach. No payment now — we&apos;ll confirm on WhatsApp,
          usually within 24 hours.
        </p>
        <Link
          href="/day-use/booking"
          className={`${CTA_BASE} bg-[#0c1a2e] text-white focus-visible:ring-[#0c1a2e] focus-visible:ring-offset-[#38bdf8]`}
        >
          Request your day
          <ArrowRight
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </Reveal>
    </div>
  );
}
