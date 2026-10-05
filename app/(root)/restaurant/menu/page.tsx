import { buildMetadata } from "@/lib/metadata";
import Link from "next/link";
import menu from "@/lib/config/menu.json";
import { RESTAURANT_HOURS } from "@/lib/constants";

export const metadata = buildMetadata({
  title: "Food Menu",
  description:
    "The full Fins restaurant menu — breakfast, pizzas, burgers, pokes, mains, drinks and desserts, with prices.",
  image: "/images/hero_images/restaurant_desktop3.webp",
  path: "/restaurant/menu",
});

type AddOn = { name: string; priceCents: number };

type MenuItem = {
  name: string;
  priceCents: number;
  description?: string;
  /** Flavours / variants that all share the item's price. */
  options?: string[];
  /** Paid extras that only apply to this item. */
  addOns?: AddOn[];
};

type MenuGroup = { name: string | null; items: MenuItem[] };

type MenuCategory = { id: string; name: string; groups: MenuGroup[] };

// Every dish and price lives in lib/config/menu.json; this page only renders it.
const categories: MenuCategory[] = menu.categories;

const formatPrice = (cents: number) => (cents / 100).toLocaleString("en-US");

function MenuPage() {
  return (
    <main className="neu-cream bg-neu-base">
      {/* ── Intro ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pt-28 md:pt-36 pb-10 md:pb-14">
        <div className="flex items-center gap-3 mb-6">
          <span
            aria-hidden="true"
            className="h-px w-7 flex-shrink-0 bg-neu-primary"
          />
          <span className="text-[0.75rem] tracking-[0.3em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
            Fins Restaurant · Sokhna · Red Sea
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2.2rem,5vw,4rem)] font-[800] tracking-[-0.02em] leading-[1] text-neu-fg">
          Food menu
        </h1>
        <p className="mt-5 max-w-xl text-[1rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[400] text-neu-muted">
          Everything we serve, from breakfast on the beach to dessert. Prices
          are in {menu.currency}. {menu.note}.
        </p>

        {/* Category jump links */}
        <nav aria-label="Menu sections" className="mt-10">
          <ul className="flex flex-wrap gap-3">
            {categories.map(({ id, name }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="neu-raised-sm neu-btn inline-flex min-h-11 items-center rounded-full px-5 text-[0.8rem] tracking-[0.08em] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pb-20 md:pb-28 grid lg:grid-cols-2 gap-8 md:gap-10 items-start">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-heading`}
            className="neu-raised scroll-mt-32 rounded-3xl p-6 md:p-8"
          >
            <h2
              id={`${category.id}-heading`}
              className="font-[family-name:var(--font-raleway)] text-[1.5rem] font-[800] tracking-[-0.01em] text-neu-fg"
            >
              {category.name}
            </h2>

            {category.groups.map((group, i) => (
              <div key={group.name ?? i} className="mt-6">
                {group.name && (
                  <h3 className="mb-1 text-[0.75rem] tracking-[0.24em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-neu-primary-ink">
                    {group.name}
                  </h3>
                )}
                <ul>
                  {group.items.map((item) => (
                    <MenuRow key={item.name} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>

      {/* ── Reserve CTA ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-14 lg:px-20 pb-20 md:pb-28">
        <div className="neu-inset rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="font-[family-name:var(--font-raleway)] text-[1.5rem] font-[800] tracking-[-0.01em] text-neu-fg">
              Your table awaits
            </h2>
            <p className="mt-2 text-[0.95rem] font-[family-name:var(--font-raleway)] font-[400] text-neu-muted">
              Open daily · {RESTAURANT_HOURS} · {menu.note}.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://wa.me/201222144388?text=Hello%2C%0AI%20would%20like%20to%20reserve%20a%20table"
              target="_blank"
              rel="noopener noreferrer"
              className="neu-btn inline-flex min-h-12 items-center rounded-2xl bg-neu-primary px-7 text-[0.95rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg shadow-neu-sm"
            >
              Reserve via WhatsApp
            </Link>
            <Link
              href="/restaurant"
              className="neu-raised-sm neu-btn inline-flex min-h-12 items-center rounded-2xl px-7 text-[0.95rem] font-[family-name:var(--font-raleway)] font-[600] text-neu-fg"
            >
              About the restaurant
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default MenuPage;

/* Rows stay flat with a hairline separator — MASTER.md: no depth on repeated dense elements. */
function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="border-b border-[rgba(180,164,138,0.3)] py-3.5 last:border-b-0 font-[family-name:var(--font-raleway)]">
      <div className="flex items-baseline justify-between gap-6">
        <span className="text-[1rem] font-[600] text-neu-fg">{item.name}</span>
        <span className="flex-shrink-0 text-[1rem] font-[600] tabular-nums text-neu-fg">
          {formatPrice(item.priceCents)}
        </span>
      </div>
      {item.description && (
        <p className="mt-1 max-w-[34rem] pr-12 text-[0.85rem] leading-relaxed font-[400] text-neu-muted">
          {item.description}
        </p>
      )}
      {item.options && (
        <p className="mt-1 pr-12 text-[0.85rem] leading-relaxed font-[400] text-neu-muted">
          {item.options.join(" · ")}
        </p>
      )}
      {item.addOns && (
        <p className="mt-1.5 pr-12 text-[0.8rem] font-[600] text-neu-primary-ink">
          {item.addOns
            .map((a) => `Add ${a.name.toLowerCase()} +${formatPrice(a.priceCents)}`)
            .join(" · ")}
        </p>
      )}
    </li>
  );
}
