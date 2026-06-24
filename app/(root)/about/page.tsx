import { buildMetadata } from "@/lib/metadata";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Get to know Fins — our story, our community and our beach near Sokhna.",
  image: "/images/about/fins.webp",
  path: "/about",
});
import storyPhoto from "@/public/images/about/fins.webp";
import teamPhoto from "@/public/images/about/fins_staff.webp";
import communityPhoto from "@/public/images/about/fins_community.webp";
import Reveal from "@/components/kitesurfing/Reveal";

const accent = "#38bdf8";

function AboutPage() {
  return (
    <main className="font-[family-name:var(--font-raleway)]">
      <PageHeader />
      <StoryPanel
        index="01"
        eyebrow="Our Story"
        title="From a hobby to a home spot"
        image={storyPhoto}
        imageAlt="Fins kitesurfing center on the Red Sea"
        imageLeft
        priority
      >
        <p>
          Our story began back in <strong className="font-[600] text-[#0c1a2e]">2007</strong>,
          when we first discovered kitesurfing. What started as a hobby quickly
          became a passion that took over our free time. We traveled, explored
          new spots, and immersed ourselves in the kitesurfing lifestyle.
        </p>
        <p>
          Years later, that passion evolved into offering professional
          kitesurfing courses and experiences. We searched for a place that
          would provide both comfort and convenience, where people could safely
          begin their kitesurfing journey while friends and family could relax
          and enjoy nature together.
        </p>
        <p>
          In 2020, after meeting{" "}
          <strong className="font-[600] text-[#0c1a2e]">Kai Sokhna</strong>, we
          knew we had found the perfect location. The spot offers ideal and
          safe conditions for learning kitesurfing, a long sandy beach, and a
          luxury restaurant and lounge — everything needed to enjoy a perfect
          day by the sea.
        </p>
      </StoryPanel>

      <StoryPanel
        index="02"
        eyebrow="Team"
        title="Here for you, every step"
        image={teamPhoto}
        imageAlt="The Fins team"
        imageLeft={false}
        tinted
      >
        <p>
          Our team is here to support you every step of the way. We take care
          of your needs, create a friendly atmosphere, and do our best to make
          you feel at home from the moment you arrive. Everyone is here to
          help — and to make your experience unforgettable.
        </p>
      </StoryPanel>

      <StoryPanel
        index="03"
        eyebrow="Community"
        title="Adventures are meant to be shared"
        image={communityPhoto}
        imageAlt="The Fins community on the beach"
        imageLeft
      >
        <p>
          We believe adventures are meant to be shared. That&apos;s why we
          focus on creating a welcoming community where people feel
          comfortable, connected, and encouraged to push their limits together
          through games, challenges, and events.
        </p>
      </StoryPanel>

      <ClosingCTA />
    </main>
  );
}

export default AboutPage;

/* ── Page header ─────────────────────────────────────────── */
function PageHeader() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 pt-16 pb-12 md:pt-24 md:pb-16">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-7 flex-shrink-0" style={{ background: accent }} />
            <span
              className="text-[0.58rem] tracking-[0.4em] uppercase font-[500]"
              style={{ color: accent }}
            >
              Since 2007 · Sokhna · Red Sea
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1 className="leading-none">
              <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[100] tracking-[-0.02em] text-[#0c1a2e] leading-[0.9]">
                About
              </span>
              <span
                className="block text-[clamp(2.4rem,5vw,4.5rem)] font-[800] tracking-[-0.02em] leading-[0.9]"
                style={{ color: accent }}
              >
                Fins.
              </span>
            </h1>
            <p className="text-[0.85rem] text-[#64748b] font-[300] max-w-xs leading-relaxed">
              A kitesurfing center, beach, and community built by people who
              fell in love with the sport — and the Red Sea.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Story panel ─────────────────────────────────────────── */
function StoryPanel({
  index,
  eyebrow,
  title,
  image,
  imageAlt,
  imageLeft,
  tinted = false,
  priority = false,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  image: StaticImageData;
  imageAlt: string;
  imageLeft: boolean;
  tinted?: boolean;
  priority?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border-t border-[#e0f2fe]"
      style={{ background: tinted ? "#f0f9ff" : "white" }}
    >
      <div className="flex flex-col md:flex-row">
        <div
          className={`relative md:w-1/2 shrink-0 min-h-[320px] md:min-h-[560px] ${
            imageLeft ? "" : "md:order-2"
          }`}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div
          className={`md:w-1/2 flex flex-col justify-center px-8 md:px-14 lg:px-20 py-14 md:py-20 ${
            imageLeft ? "" : "md:order-1"
          }`}
        >
          <Reveal>
            <span
              className="block font-[100] text-[3.8rem] leading-none select-none mb-6"
              style={{ color: "#bae6fd" }}
            >
              {index}
            </span>

            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-7 flex-shrink-0" style={{ background: accent }} />
              <span
                className="text-[0.58rem] tracking-[0.4em] uppercase font-[500]"
                style={{ color: accent }}
              >
                {eyebrow}
              </span>
            </div>

            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-[100] tracking-[-0.01em] leading-[1.05] text-[#0c1a2e] mb-6">
              {title}
            </h2>

            <div className="flex flex-col gap-4 text-[0.88rem] font-[300] leading-relaxed text-[#64748b] max-w-lg">
              {children}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Closing CTA ─────────────────────────────────────────── */
function ClosingCTA() {
  return (
    <section
      className="rounded-t-[2.5rem] md:rounded-t-[4rem]"
      style={{ background: "#0c1a2e" }}
    >
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-28 flex flex-col items-center text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-7" style={{ background: accent }} />
            <span
              className="text-[0.58rem] tracking-[0.4em] uppercase font-[500]"
              style={{ color: accent }}
            >
              Fins Kitesurfing Center
            </span>
            <span className="h-px w-7" style={{ background: accent }} />
          </div>

          <h2 className="leading-none mb-6">
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[100] tracking-[-0.02em] text-white leading-[0.95]">
              Come ride
            </span>
            <span
              className="block text-[clamp(2.2rem,4.5vw,4rem)] font-[800] tracking-[-0.02em] leading-[0.95]"
              style={{ color: accent }}
            >
              with us.
            </span>
          </h2>

          <p className="text-[0.85rem] font-[300] max-w-md leading-relaxed mx-auto mb-10 text-white/50">
            Learn to kitesurf, spend a day on the beach, or just come by for
            lunch with a sea view — we&apos;d love to have you.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/kitesurfing"
              className="inline-flex items-center gap-2 rounded-full text-[0.7rem] font-[700] tracking-[0.14em] uppercase px-7 py-3.5 transition-opacity duration-200 hover:opacity-85"
              style={{ background: accent, color: "#0c1a2e" }}
            >
              Explore kitesurfing →
            </Link>
            <Link
              href="/day-use/booking"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white text-[0.7rem] font-[600] tracking-[0.14em] uppercase px-7 py-3.5 transition-colors duration-200 hover:border-white/70"
            >
              Book a beach day
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
