import Link from "next/link";
import { StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import dayUseMobile from "@/public/images/hero_images/hero_mobile1.webp";
import dayUseDesktop from "@/public/images/hero_images/hero_desktop1.webp";
import { HeroSlide, heroPrimaryCta, heroSecondaryLink } from "./HeroSlide";

type DayUseHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function DayUseHero({
  mobileSrc = dayUseMobile,
  desktopSrc = dayUseDesktop,
}: DayUseHeroProps) {
  return (
    <HeroSlide
      mobileSrc={mobileSrc}
      desktopSrc={desktopSrc}
      alt="Day use beach at Fins Sokhna"
      accent="#fbbf24"
      eyebrow="Beach Club · Sokhna · Red Sea"
      title="Beach"
      subtitle="Day Use"
      description="Amazing food, soft sand, activities and more. Everything you need for a perfect day out."
      actions={
        <>
          <Link href="/day-use/booking" className={heroPrimaryCta}>
            Reserve Your Day
            <ArrowRight
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
          <Link href="/day-use" className={heroSecondaryLink}>
            Learn more
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </>
      }
    />
  );
}
