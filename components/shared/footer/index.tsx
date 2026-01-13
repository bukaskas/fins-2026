import {
  EMAIL_ADDRESS,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LOCATION_ADDRESS,
  WHATSAPP_PHONE,
} from "@/lib/constants";
import { Mail, Map } from "lucide-react";
import Link from "next/link";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import white_logo from "@/public/images/fins-white-logo.svg";

import { TiSocialFacebookCircular } from "react-icons/ti";
function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto bg-gray-800 text-white z-50">
      {/* First row */}
      <div className="grid grid-cols-3 md:mx-28 gap-4 p-4 ">
        <Image src={white_logo} alt="Fins Logo" width={150} height={150} />

        <div className="flex flex-col gap-2">
          <div className="font-semibold">Contact us</div>
          <div className="flex flex-row gap-2 items-center">
            <FaWhatsapp className="text-base" size={22} />
            <Link
              href={`https://wa.me/20${WHATSAPP_PHONE.substring(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-gray-300"
            >
              {WHATSAPP_PHONE}
            </Link>
          </div>

          <div>
            <Link
              href={`${LOCATION_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-row gap-2 items-center hover:underline hover:text-gray-300 flex flex-row items-center italic"
            >
              <Map /> Click here
            </Link>
          </div>

          <Link
            href={`mailto:${EMAIL_ADDRESS}`}
            className="hover:underline hover:text-gray-300 flex flex-row gap-2 items-center italic"
          >
            <Mail size={25} className="shrink-0" />
            {EMAIL_ADDRESS}
          </Link>
        </div>
        <div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Socials</div>
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2"
            >
              <FaInstagram size={25} />
            </Link>
            <Link
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 font-semibold"
            >
              <TiSocialFacebookCircular size={25} />
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 md:mx-28 gap-4 p-4 ">
        {/* Second row */}
        <div>
          <div className="font-semibold">Kite</div>
          <div>Lessons</div>
          <div>Rental</div>
          <div>Storage</div>
        </div>
        <div>
          <div className="font-semibold">Day use</div>
          <div>Info</div>
          <div>Reservations</div>
        </div>
        <div>
          <div className="font-semibold">Restaurant</div>
          <div>Menu</div>
          <div>Photos</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
