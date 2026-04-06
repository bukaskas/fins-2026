import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import kiteMobile from "@/public/images/hero_images/hero_mobile2.webp";
import kiteDesktop from "@/public/images/hero_images/kitesurfing_desktop2.webp";
type PharaohHeroProps = {
  mobileSrc?: StaticImageData;
  desktopSrc?: StaticImageData;
};

export function PharaohHero({
  mobileSrc = kiteMobile,
  desktopSrc = kiteDesktop,
}: PharaohHeroProps) {
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
        <div className="text-center bg-white/30  rounded-2xl p-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Pharaoh Airstyle Competition
          </h1>
          <p className="mt-6 text-base leading-relaxed text-gray-700 text-pretty sm:text-lg">
            A kitesurfing airstyle event where the best kiters meet the best
            company — riders pushing their level, music on the beach, activities
            for grown ups and kids.
          </p>
          <div className="mt-8 inline-block border-t border-gray-400 pt-6 w-full">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Save the date
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">
              1<sup className="text-base align-super">st</sup> of May
            </p>
          </div>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="rounded-full text-xl">
              <Link href="/kitesurfing/booking/pharaoh">Book now</Link>
            </Button>
            <Link
              href="https://wa.me/201080500099?text=Hello%2C%0AI%20want%20to%20book%20beginner%20course"
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
