import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import kiteMobile from "@/public/images/hero_images/hero_mobile2.webp";
import kiteDesktop from "@/public/images/hero_images/kitesurfing_desktop2.webp";
type KitesurfingHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function KitesurfingHero({
  mobileSrc = kiteMobile,
  desktopSrc = kiteDesktop,
}: KitesurfingHeroProps) {
  return (
    <div className="relative isolate h-screen flex items-center justify-center">
      {/* Background images: mobile and desktop */}
      <Image
        src={mobileSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover sm:hidden bg-white"
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
            Learn kitesurfing with IKO certified instructors.{" "}
            <a href="/kitesurfing" className="font-semibold text-blue-600">
              <span aria-hidden="true" className="absolute inset-0" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center bg-white/30  rounded-2xl p-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Kitesurfing lessons
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty sm:text-xl/8 ">
            Escape the city and discover kitesurfing in our perfect shallow
            lagoon with steady winds and beautiful beaches near Cairo.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="rounded-full text-xl">
              <Link href="/kitesurfing">Book lessons</Link>
            </Button>
            <Link
              href="/kitesurfing"
              className="text-sm/6 font-semibold text-gray-900"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
