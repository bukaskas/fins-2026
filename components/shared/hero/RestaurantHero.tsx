import { StaticImageData } from "next/image";
import { ArrowUpRight } from "lucide-react";
import restaurantMobile from "@/public/images/hero_images/hero_mobile3.webp";
import restaurantDesktop from "@/public/images/hero_images/restaurant_desktop3.webp";
import { HeroSlide, heroPrimaryCta, heroSecondaryLink } from "./HeroSlide";

type RestaurantHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function RestaurantHero({
  mobileSrc = restaurantMobile,
  desktopSrc = restaurantDesktop,
}: RestaurantHeroProps) {
  return (
    <HeroSlide
      mobileSrc={mobileSrc}
      desktopSrc={desktopSrc}
      alt="Restaurant at Fins Sokhna"
      accent="#fb923c"
      eyebrow="Beachfront Dining · Sokhna"
      title="Dine"
      subtitle="By the Sea"
      description="Savor international cuisine, burgers and pizza with stunning beach views."
      actions={
        <>
          {/* Both leave the site (WhatsApp, Google Drive), so they open in a
              new tab and say so, like BookCourseLink. */}
          <a
            href="https://wa.me/201222144388?text=Hello%2C%0AI%20would%20like%20to%20reserve%20a%20table"
            target="_blank"
            rel="noopener noreferrer"
            className={heroPrimaryCta}
          >
            Reserve a Table
            <ArrowUpRight
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
          <a
            href="https://drive.google.com/file/d/1Y2Ri--GD0a6M6NdTR3a2s3rzQaEBubuz/view"
            target="_blank"
            rel="noopener noreferrer"
            className={heroSecondaryLink}
          >
            View Menu
            <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </>
      }
    />
  );
}
