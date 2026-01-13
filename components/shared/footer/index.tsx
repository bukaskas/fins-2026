import {
  EMAIL_ADDRESS,
  LOCATION_ADDRESS,
  WHATSAPP_PHONE,
} from "@/lib/constants";
import { Mail, Map } from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto bg-gray-800 text-white z-50">
      {/* First row */}
      <div className="grid grid-cols-3 md:mx-28 gap-4 p-4 ">
        <div>White logo</div>

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
          <div className="flex flex-row gap-2 items-center">
            <Link
              href={`mailto:${EMAIL_ADDRESS}`}
              className="hover:underline hover:text-gray-300 flex flex-row gap-2 items-center italic"
            >
              <Mail size={22} />
              {EMAIL_ADDRESS}
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
        </div>
        <div>
          <div>Instagram</div>
          <div>Facebook</div>
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
