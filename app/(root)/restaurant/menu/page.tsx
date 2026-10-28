import { buildMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { Caveat, Caveat_Brush } from "next/font/google";
import menu from "@/lib/config/menu.json";
import { RESTAURANT_HOURS } from "@/lib/constants";

export const metadata = buildMetadata({
  title: "Food Menu",
  description:
    "The full Fins restaurant menu — breakfast, tacos, pizzas, burgers, mains, drinks and desserts, with prices.",
  image: "/images/hero_images/restaurant_desktop3.webp",
  path: "/restaurant/menu",
});

// Handwritten faces from the printed menu: Brush for chapter titles, Caveat for dish names and prices.
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });
const caveatBrush = Caveat_Brush({ subsets: ["latin"], weight: "400" });

type AddOn = { name: string; priceCents: number };

type MenuItem = {
  name: string;
  priceCents: number;
  description?: string;
  /** Dish photo; items with one render as a tile, the rest as list rows. */
  image?: string;
  /** Flavours / variants that all share the item's price. */
  options?: string[];
  /** Paid extras that only apply to this item. */
  addOns?: AddOn[];
};

type MenuGroup = { name: string | null; image?: string; items: MenuItem[] };

type MenuCategory = { id: string; name: string; groups: MenuGroup[] };

// Every dish and price lives in lib/config/menu.json; this page only renders it.
const categories: MenuCategory[] = menu.categories;

const formatPrice = (cents: number) => (cents / 100).toLocaleString("en-US");

function MenuPage() {
  return (
    <div className="menu-board bg-(--menu-paper) text-(--menu-ink)">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <Image
          src="/images/restaurant/menu/beach-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_80%]"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-[10vh] text-center">
          <p className="text-[0.7rem] tracking-[0.5em] uppercase text-(--menu-eyebrow)">
            — Fins · Sokhna · Red Sea —
          </p>
          <h1
            className={`${caveatBrush.className} text-[clamp(3.5rem,10vw,7rem)] leading-none text-(--menu-brown)`}
          >
            Food menu
          </h1>
        </div>
      </section>

      {/* ── Sticky chapter bar (scrolls sideways on phones) ─── */}
      <nav
        aria-label="Menu sections"
        className="sticky top-24 md:top-[118px] z-30 border-y border-(--menu-line) bg-(--menu-paper)/90 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {categories.map(({ id, name }) => (
            <li key={id} className="flex-shrink-0">
              <a
                href={`#${id}`}
                className={`${caveat.className} inline-flex min-h-11 items-center rounded-full px-4 text-[1.35rem] font-[700] text-(--menu-navy) hover:bg-white/70`}
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Categories ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-20 md:px-10">
        <p className="pt-10 text-center text-[0.75rem] font-[800] uppercase tracking-[0.08em] text-(--menu-navy)">
          Prices in {menu.currency} · {menu.note}
        </p>

        {categories.map((category) => {
          const tiles = category.groups.flatMap((g) => g.items).filter((i) => i.image);
          const lists = category.groups
            .map((g) => ({ ...g, items: g.items.filter((i) => !i.image) }))
            .filter((g) => g.items.length);
          return (
            <section
              key={category.id}
              id={category.id}
              aria-labelledby={`${category.id}-heading`}
              className="scroll-mt-44 md:scroll-mt-52 pt-14"
            >
              <header className="mb-8 flex items-center gap-4">
                <h2
                  id={`${category.id}-heading`}
                  className={`${caveatBrush.className} text-[3rem] leading-none text-(--menu-brown)`}
                >
                  {category.name}
                </h2>
                <span className="h-px flex-1 bg-(--menu-line)" />
              </header>

              {tiles.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tiles.map((item) => (
                    <DishTile key={item.name} item={item} />
                  ))}
                </ul>
              )}

              {lists.length > 0 && (
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {lists.map((group) => (
                    <ListCard key={group.name ?? category.id} group={group} fallbackTitle={category.name} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── Reserve CTA ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-10 md:pb-28">
        <div className="flex flex-col gap-8 rounded-3xl bg-(--menu-cream) p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className={`${caveatBrush.className} text-[2.6rem] leading-none text-(--menu-brown)`}>
              Your table awaits
            </h2>
            <p className="mt-3 text-[0.95rem] text-(--menu-muted)">
              Open daily · {RESTAURANT_HOURS} · {menu.note}.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://wa.me/201222144388?text=Hello%2C%0AI%20would%20like%20to%20reserve%20a%20table"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-2xl bg-(--menu-navy) px-7 text-[0.95rem] font-[600] text-white"
            >
              Reserve via WhatsApp
            </Link>
            <Link
              href="/restaurant"
              className="inline-flex min-h-12 items-center rounded-2xl border border-(--menu-navy) px-7 text-[0.95rem] font-[600] text-(--menu-navy)"
            >
              About the restaurant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MenuPage;

function DishTile({ item }: { item: MenuItem }) {
  return (
    <li className="flex flex-col rounded-3xl bg-(--menu-cream) p-4">
      <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden rounded-2xl">
        <Image
          src={item.image!}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          className="object-cover"
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 px-1">
        <h3 className={`${caveat.className} text-[1.9rem] font-[700] leading-[0.95] text-(--menu-navy)`}>
          {item.name}
        </h3>
        <span className={`${caveat.className} flex-shrink-0 text-[1.7rem] font-[500] tabular-nums text-(--menu-navy)`}>
          {formatPrice(item.priceCents)}
        </span>
      </div>
      {(item.description || item.options) && (
        <p className="mt-1 px-1 pb-1 text-[0.85rem] leading-relaxed text-(--menu-muted)">
          {item.description ?? item.options!.join(" · ")}
        </p>
      )}
      {item.addOns && <AddOnLine addOns={item.addOns} />}
    </li>
  );
}

/* Photo-less groups (coffee, soft drinks, add-ons) collapse into one card of flat rows. */
function ListCard({ group, fallbackTitle }: { group: MenuGroup; fallbackTitle: string }) {
  const isAddOns = /add/i.test(group.name ?? "");
  return (
    <div className="rounded-3xl bg-(--menu-cream) p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className={`${caveat.className} text-[2rem] font-[700] leading-none text-(--menu-navy)`}>
          {group.name ?? fallbackTitle}
        </h3>
        {group.image && (
          <Image src={group.image} alt="" width={120} height={160} className="-mt-2 h-20 w-auto" />
        )}
      </div>
      <ul className="mt-3">
        {group.items.map((item) => (
          <li key={item.name} className="flex items-baseline justify-between gap-4 py-1.5">
            <span>
              <span className="font-[700]">{item.name}</span>
              {item.options && (
                <span className="block text-[0.8rem] text-(--menu-muted)">{item.options.join(" · ")}</span>
              )}
              {item.addOns && <AddOnLine addOns={item.addOns} />}
            </span>
            <span className="font-[700] tabular-nums text-(--menu-navy)">
              {isAddOns ? "+" : ""}
              {formatPrice(item.priceCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddOnLine({ addOns }: { addOns: AddOn[] }) {
  return (
    <span className="mt-1 block px-1 text-[0.8rem] font-[600] text-(--menu-brown)">
      {addOns.map((a) => `Add ${a.name.toLowerCase()} +${formatPrice(a.priceCents)}`).join(" · ")}
    </span>
  );
}
