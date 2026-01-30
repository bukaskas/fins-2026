"use client";
import Image from "next/image";
import heroKiteImage from "@/public/images/product-1.webp";

import rentalPhoto from "@/public/images/webphotos_fins/webphoto_22.webp";
import ContentSection from "@/components/kitesurfing/CoursesSection";
import KitesurfingRentalSection from "@/components/kitesurfing/KitesurfingRentalSection";

function KitesurfingPage() {
  return (
    <>
      <HeroSection />
      <NavigationMenu />
      <ContentSection />
      <KitesurfingRentalSection />
      <StorageTable />
    </>
  );
}

export default KitesurfingPage;

function HeroSection() {
  return (
    <div>
      <Image
        src={heroKiteImage}
        alt="Kitesurfing"
        className="absolute inset-0 -z-10 min-h-150 max-h-150 object-cover"
        priority
      />
      <h4 className="text-center text-white font-semibold mt-100 text-4xl font-[family-name:var(--font-raleway)] ">
        Kitesurfing lessons
      </h4>
    </div>
  );
}

function NavigationMenu() {
  return (
    <nav className=" bg-white   ">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="flex justify-center gap-8 py-4 flex-wrap">
          <li>
            <a
              href="#courses"
              className="text-sm font-semibold text-gray-700 hover:text-stone-600 transition-colors font-[family-name:var(--font-raleway)]"
            >
              Courses
            </a>
          </li>
          <li>
            <a
              href="#rental"
              className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors font-[family-name:var(--font-raleway)]"
            >
              Equipment Rental
            </a>
          </li>
          <li>
            <a
              href="#storage"
              className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors font-[family-name:var(--font-raleway)]"
            >
              Equipment Storage
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function StorageTable() {
  return (
    <section id="storage" className="max-w-4xl mx-auto ">
      <div className="w-full h-30 overflow-hidden flex items-center justify-center relative">
        <Image
          alt="kitesurfing equipment rental"
          src={rentalPhoto}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-stone-600/40" />
        <h3 className="absolute z-10 text-5xl text-white font-semibold text-center  px-4 font-[family-name:var(--font-raleway)]  ">
          Equipment Storage
        </h3>
      </div>

      <div className="overflow-x-auto mt-4 px-6 ">
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden mb-4">
          <thead className="bg-stone-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Time
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">One week</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                500
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">One month</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                1200
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Three months</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                3000
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
