import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import restaurantMobile from "@/public/images/hero_images/hero_mobile3.webp";
import restaurantDesktop from "@/public/images/hero_images/restaurant_desktop3.webp";

type RestaurantHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function RestaurantHero({
  mobileSrc = restaurantMobile,
  desktopSrc = restaurantDesktop,
}: RestaurantHeroProps) {
  return (
    <div className="relative isolate h-screen flex items-center justify-center">
      {/* Background images: mobile and desktop */}
      <Image
        src={mobileSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover sm:hidden"
      />
      <Image
        src={desktopSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 hidden sm:block object-cover"
      />

      <div className="mx-auto max-w-2xl px-10">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
            Delicious beachfront dining experience.{" "}
            <a href="/restaurant" className="font-semibold text-red-600">
              <span aria-hidden="true" className="absolute inset-0" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center bg-white/30 rounded-2xl p-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Beachfront Restaurant in Sokhna
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty  rounded-full p-4 sm:text-xl/8">
            Discover the perfect blend of international cuisine and pizza. Enjoy
            fresh flavors at our restaurant by the beach, where every table
            comes with a sea breeze and a view.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="rounded-full text-xl" size={"lg"}>
              <Link href="/restaurant">Reserve a table</Link>
            </Button>
            <Link
              href="/restaurant"
              className="text-sm/6 font-semibold text-gray-900"
            >
              View menu <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
