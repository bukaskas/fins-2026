import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { Caveat, Caveat_Brush } from "next/font/google";
import menu from "@/lib/config/menu.json";
import { RESTAURANT_HOURS } from "@/lib/constants";
import restaurantPhoto from "@/public/images/restaurant/restaurant.webp";
import restaurantMobile from "@/public/images/restaurant/restaurant_mobilefins.webp";
import webphoto17 from "@/public/images/webphotos_fins/webphoto_17.webp";

export const metadata = buildMetadata({
  title: "Restaurant",
  description:
    "Eat and relax at the Fins restaurant — fresh food by the beach near Sokhna.",
  image: "/images/hero_images/restaurant_desktop3.webp",
  path: "/restaurant",
});

// Same handwritten faces and .menu-board palette as /restaurant/menu, so the two pages read as one place.
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });
const caveatBrush = Caveat_Brush({ subsets: ["latin"], weight: "400" });

const MENU_HREF = "/restaurant/menu";
const WHATSAPP_HREF =
  "https://wa.me/201222144388?text=Hello%2C%0AI%20would%20like%20to%20reserve%20a%20table";

// Each menu chapter links to its section on /restaurant/menu.
const chapters = menu.categories.map((c) => ({ id: c.id, name: c.name }));

function RestaurantPage() {
  return (
    <main className="menu-board bg-(--menu-paper) text-(--menu-ink) font-[family-name:var(--font-raleway)]">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pt-12 pb-14 md:grid-cols-2 md:px-14 md:pt-16 lg:px-20">
        <div>
          <p className="text-[0.75rem] font-[600] uppercase tracking-[0.32em] text-(--menu-eyebrow)">
            Fins Restaurant · Sokhna Red Sea
          </p>
          <h1
            className={`${caveatBrush.className} mt-3 text-[clamp(3.2rem,7vw,5.5rem)] leading-[0.95] text-(--menu-brown)`}
          >
            Food worth lingering over
          </h1>
          <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-(--menu-muted)">
            Sit back with a clear Red Sea view and a meal that earns its setting. Simple, fresh,
            honest food, right on the water.
          </p>
          <p className="mt-6 text-[0.8rem] font-[700] uppercase tracking-[0.14em] text-(--menu-navy)">
            Open daily · {RESTAURANT_HOURS}
          </p>
          <Link
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl border border-(--menu-navy) px-6 font-[600] text-(--menu-navy)"
          >
            Reserve via WhatsApp
          </Link>
        </div>

        {/* The printed menu's cover — the whole card opens the menu. */}
        <Link
          href={MENU_HREF}
          aria-label="Open the food menu"
          className="group relative block aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(138,74,31,0.55)] ring-1 ring-(--menu-line) transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-0.6deg] motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          <Image
            src="/images/restaurant/menu/beach-banner.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-[50%_75%] transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="relative z-10 flex h-full flex-col items-center pt-[10%] text-center">
            <span className="text-[0.7rem] font-[600] uppercase tracking-[0.5em] text-(--menu-eyebrow)">
              — Fins —
            </span>
            <span
              className={`${caveatBrush.className} text-[clamp(3rem,7vw,5rem)] leading-none text-(--menu-brown)`}
            >
              Food menu
            </span>
          </div>
          <span className="absolute bottom-5 left-1/2 z-10 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-(--menu-navy) px-6 text-[0.95rem] font-[700] text-white shadow-lg">
            Open the menu{" "}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      </section>

      <nav aria-label="Menu sections" className="border-y border-(--menu-line) bg-(--menu-cream)">
        <ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-2 gap-y-1 px-6 py-4">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`${MENU_HREF}#${c.id}`}
                className={`${caveat.className} inline-flex min-h-11 items-center rounded-full px-3 text-[1.4rem] font-[700] text-(--menu-navy) hover:bg-white/70`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-14 lg:px-20">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr] md:gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl md:row-span-2 md:aspect-auto">
            <Image
              src={restaurantPhoto}
              alt="Dining at Fins restaurant, Sokhna"
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={webphoto17}
              alt="Fins restaurant food"
              fill
              sizes="(min-width: 768px) 30vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={restaurantMobile}
              alt="Fins beach club restaurant atmosphere"
              fill
              sizes="(min-width: 768px) 30vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-14 lg:px-20">
        <div className="flex flex-col gap-6 rounded-3xl bg-(--menu-cream) p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <h2 className={`${caveatBrush.className} text-[2.6rem] leading-none text-(--menu-brown)`}>
            Your table awaits
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-2xl bg-(--menu-navy) px-7 font-[600] text-white"
            >
              Reserve via WhatsApp
            </Link>
            <Link
              href={MENU_HREF}
              className="inline-flex min-h-12 items-center rounded-2xl border border-(--menu-navy) px-7 font-[600] text-(--menu-navy)"
            >
              Open the menu
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RestaurantPage;
