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
            Spending a beautiful day by the beach.{" "}
            <a href="/day-use" className="font-semibold text-orange-600">
              <span aria-hidden="true" className="absolute inset-0" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center bg-white/30 rounded-2xl p-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Spend a beautiful day by the beach
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty sm:text-xl/8 ">
            Amazing food, soft sand, activities and more. All you need for a
            perfect day out.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="rounded-full text-xl">
              <Link href="/day-use">Book now</Link>
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
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ffd700] to-[#ff8c00] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
        />
      </div>
    </div>
  );
}
