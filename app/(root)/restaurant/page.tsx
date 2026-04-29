import Image from "next/image";
import Link from "next/link";
import restaurantPhoto from "@/public/images/restaurant/restaurant.webp";
import restaurantMobile from "@/public/images/restaurant/restaurant_mobilefins.webp";
import webphoto17 from "@/public/images/webphotos_fins/webphoto_17.webp";

const menuHighlights = [
  {
    index: "01",
    category: "Pizza",
    accent: "Stone-baked",
    description:
      "Classic Neapolitan bases with seasonal toppings, fired to order in our stone oven.",
  },
  {
    index: "02",
    category: "Pasta",
    accent: "Made with care",
    description:
      "Traditional pasta dishes prepared with imported Italian ingredients and house-made sauces.",
  },
  {
    index: "03",
    category: "Burgers",
    accent: "Grilled daily",
    description:
      "Juicy patties, house sauces, crispy fries — the kind of burger you come back for.",
  },
];

function RestaurantPage() {
  return (
    <main style={{ background: "#faf8f4" }}>
      <style>{`
        @keyframes restFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rest-reveal-1 { animation: restFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .rest-reveal-2 { animation: restFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.18s both; }
        .rest-reveal-3 { animation: restFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.3s both; }
      `}</style>

      {/* ── Intro strip ─────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid #e7e0d5" }}>
        <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-12 md:py-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          {/* Left: headline */}
          <div className="rest-reveal-1">
            <p
              className="text-[0.58rem] tracking-[0.42em] uppercase font-[family-name:var(--font-raleway)] font-[500] mb-4"
              style={{ color: "#fb923c" }}
            >
              Fins Restaurant · Sokhna Red Sea
            </p>
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span
                className="block text-[clamp(2.6rem,5.5vw,4.8rem)] font-[100] tracking-[-0.02em] leading-[0.9]"
                style={{ color: "#1c1917" }}
              >
                Food worth
              </span>
              <span
                className="block text-[clamp(2.6rem,5.5vw,4.8rem)] font-[800] tracking-[-0.02em] leading-[0.9]"
                style={{ color: "#fb923c" }}
              >
                lingering over
              </span>
            </h2>
          </div>

          {/* Right: description + meta */}
          <div className="rest-reveal-2 max-w-xs">
            <p
              className="text-[0.88rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[300] mb-5"
              style={{ color: "#78716c" }}
            >
              Sit back with a clear Red Sea view and a meal that earns its
              setting. Simple, fresh, honest food — right on the water.
            </p>
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[400]"
              style={{ color: "#a8a29e" }}
            >
              <span>Open Daily</span>
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: "#d6cfc6" }}
              />
              <span>9:00 AM – 11:00 PM</span>
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: "#d6cfc6" }}
              />
              <span>Beachfront</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Menu highlights ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-28">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-14 rest-reveal-1">
          <span
            className="h-px w-7 flex-shrink-0"
            style={{ background: "#fb923c" }}
          />
          <span
            className="text-[0.58rem] tracking-[0.4em] uppercase font-[family-name:var(--font-raleway)] font-[500]"
            style={{ color: "#fb923c" }}
          >
            What we serve
          </span>
        </div>

        {/* Three columns */}
        <div
          className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: "#e7e0d5" }}
        >
          {menuHighlights.map(({ index, category, accent, description }, i) => (
            <div
              key={index}
              className="py-10 md:py-2 md:px-10 first:md:pl-0 last:md:pr-0 flex flex-col gap-5"
            >
              {/* Ghost index */}
              <span
                className="font-[family-name:var(--font-raleway)] font-[100] text-[5rem] leading-none select-none"
                style={{ color: "#e7e0d5" }}
              >
                {index}
              </span>

              {/* Name + accent label */}
              <div>
                <h3
                  className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,4vw,3rem)] font-[100] tracking-[-0.02em] leading-[0.9]"
                  style={{ color: "#1c1917" }}
                >
                  {category}
                </h3>
                <span
                  className="inline-block text-[0.58rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] mt-2"
                  style={{ color: "#fb923c" }}
                >
                  {accent}
                </span>
              </div>

              {/* Description */}
              <p
                className="text-[0.82rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[300] max-w-[17rem]"
                style={{ color: "#78716c" }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Menu PDF link */}
        <div className="mt-14 pt-10" style={{ borderTop: "1px solid #e7e0d5" }}>
          <Link
            href="https://drive.google.com/file/d/1ucvNArsKuwd_Em9CXWguJKIIshlh-dG0/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 text-[0.67rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-opacity duration-200 hover:opacity-60"
            style={{ color: "#fb923c" }}
          >
            View Full Menu
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* ── Photo mosaic ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 pb-20 md:pb-28">
        {/* Top: wide panoramic */}
        <div className="relative aspect-[16/7] overflow-hidden mb-3 md:mb-4">
          <Image
            src={restaurantPhoto}
            alt="Dining at Fins restaurant, Sokhna"
            fill
            className="object-cover transition-transform duration-700 hover:scale-[1.025]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        {/* Bottom: two portraits */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={webphoto17}
              alt="Fins restaurant food"
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.025]"
              sizes="(max-width: 768px) 50vw, 640px"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={restaurantMobile}
              alt="Fins beach club restaurant atmosphere"
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.025]"
              sizes="(max-width: 768px) 50vw, 640px"
            />
          </div>
        </div>
      </section>

      {/* ── Reserve CTA ──────────────────────────────────────── */}
      <section style={{ background: "#1c1917" }}>
        <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 py-20 md:py-28 flex flex-col md:flex-row md:items-end md:justify-between gap-12">
          {/* Left: heading */}
          <div>
            <p
              className="text-[0.58rem] tracking-[0.42em] uppercase font-[family-name:var(--font-raleway)] font-[500] mb-5"
              style={{ color: "#fb923c" }}
            >
              Reserve · Fins Restaurant
            </p>
            <h2 className="font-[family-name:var(--font-raleway)] leading-none">
              <span className="block text-[clamp(3rem,6.5vw,6rem)] font-[100] tracking-[-0.02em] text-white leading-[0.88]">
                Your table
              </span>
              <span
                className="block text-[clamp(3rem,6.5vw,6rem)] font-[800] tracking-[-0.02em] leading-[0.88]"
                style={{ color: "#fb923c" }}
              >
                awaits
              </span>
            </h2>
          </div>

          {/* Right: CTAs */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <Link
              href="https://wa.me/201222144388?text=Hello%2C%0AI%20would%20like%20to%20reserve%20a%20table"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 text-black text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)] transition-opacity duration-200 hover:opacity-85"
              style={{ background: "#fb923c" }}
            >
              Reserve via WhatsApp
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Link>
            <Link
              href="https://drive.google.com/file/d/1ucvNArsKuwd_Em9CXWguJKIIshlh-dG0/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 text-[0.72rem] font-[400] tracking-[0.14em] uppercase px-7 py-3.5 font-[family-name:var(--font-raleway)] transition-colors duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              View Menu
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                ↗
              </span>
            </Link>
            <p
              className="text-[0.62rem] tracking-[0.16em] font-[family-name:var(--font-raleway)] font-[300] mt-2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Open daily · 9:00 AM – 11:00 PM · Sokhna Red Sea
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RestaurantPage;
