import Link from "next/link";
import { StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import kiteMobile from "@/public/images/hero_images/hero_mobile2.webp";
import kiteDesktop from "@/public/images/hero_images/kitesurfing_desktop2.webp";
import BookCourseLink from "@/components/kitesurfing/BookCourseLink";
import { HeroSlide, heroPrimaryCta, heroSecondaryLink } from "./HeroSlide";

type KitesurfingHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function KitesurfingHero({
  mobileSrc = kiteMobile,
  desktopSrc = kiteDesktop,
}: KitesurfingHeroProps) {
  return (
    <HeroSlide
      mobileSrc={mobileSrc}
      desktopSrc={desktopSrc}
      alt="Kitesurfing at Fins Sokhna"
      accent="#38bdf8"
      eyebrow="IKO Certified · Red Sea · Sokhna"
      title="Kite"
      subtitle="Surfing"
      description="Escape the city. Discover kitesurfing in our shallow lagoon — steady winds, shallow water, and courses for all levels."
      actions={
        <>
          {/* Goes through BookCourseLink like every other booking CTA, so the
              homepage slide cannot drift from the rest: same label, same
              external handling, same source attribution. */}
          <BookCourseLink className={heroPrimaryCta}>
            Book a course
          </BookCourseLink>
          <Link href="/kitesurfing#courses" className={heroSecondaryLink}>
            Learn more
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </>
      }
    />
  );
}
