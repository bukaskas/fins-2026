import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import dayUseMobile from "@/public/images/hero_images/hero_mobile1.webp";
import dayUseDesktop from "@/public/images/hero_images/hero_desktop1.webp";
type DayUseHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function DayUseHero({
  mobileSrc = dayUseMobile,
  desktopSrc = dayUseDesktop,
}: DayUseHeroProps) {
  return (
    <div className="relative isolate h-screen flex items-center justify-centers">
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
            Day Use experience
            <a href="/day-use" className="font-semibold text-orange-600">
              <span aria-hidden="true" className="absolute inset-0" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center bg-white/30 rounded-2xl p-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Beach
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty sm:text-xl/8 ">
            Amazing food, soft sand, activities and more. All you need for a
            perfect day out.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="rounded-full text-xl">
              <Link href="https://wa.me/201222144388?text=Hello%2C%0AI%20want%20to%20reserve%20day%20use">
                Book now
              </Link>
            </Button>
            <Link
              href="/day-use"
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
