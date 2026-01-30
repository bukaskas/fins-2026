import Image from "next/image";
import rentalPhoto from "@/public/images/webphotos_fins/webphoto_22.webp";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function KitesurfingRentalSection() {
  useGSAP(() => {
    gsap.from("#rental", {
      scrollTrigger: {
        trigger: "#rental",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      opacity: 0,
      duration: 4,
      ease: "power2.out",
    });
  });

  return (
    <section id="rental" className="max-w-4xl mx-auto ">
      <div className="w-full h-30 overflow-hidden flex items-center justify-center relative">
        <Image
          alt="kitesurfing equipment rental"
          src={rentalPhoto}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-stone-600/40" />
        <h3 className="absolute z-10 text-5xl text-white font-semibold text-center  px-4 font-[family-name:var(--font-raleway)]  ">
          Equipment Rental
        </h3>
      </div>

      <div className="overflow-x-auto mt-4 px-6 ">
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden mb-4">
          <thead className="bg-stone-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Item
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Half day
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Full day
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Full equipment rental</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                3500
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                5200
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">2 days Full equipment</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                6000
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                9000
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Kite and bar</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                3000
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                4000
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Board only</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                1000
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                1700
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Bar only</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                1000
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                1700
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Wetsuit / Harness</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                500
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                600
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Leash/helmet</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                250
              </td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                350
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default KitesurfingRentalSection;
