import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_PHONE } from "@/lib/constants";

export default function WhatsAppButton() {
  return (
    <Link
      href={`https://wa.me/20${WHATSAPP_PHONE.substring(1)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
      aria-label="Contact us on WhatsApp"
    >
      <FaWhatsapp size={32} />
    </Link>
  );
}
