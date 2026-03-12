import Image from "next/image";
import rentalPhoto from "@/public/images/webphotos_fins/webphoto_22.webp";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function MembershipSections() {
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
          Beach access and memberships
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
                Price{" "}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Beach use</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                800 EGP / day
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Family membership</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                30,000 EGP / year
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm">Private membership</td>
              <td className="px-6 py-4 text-sm text-center font-semibold">
                25,000 EGP / year
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-gray-600 mb-4">
          * Family membership includes 2 adults and up to 2 children under 18.
          Private membership includes 1 adult. Both memberships include beach
          access, discounts on rentals and storage, and priority booking for
          lessons and events.
        </p>
      </div>
    </section>
  );
}

export default MembershipSections;
