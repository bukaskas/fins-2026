import {
  APP_NAME,
  EMAIL_ADDRESS,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LOCATION_ADDRESS,
  WHATSAPP_PHONE,
} from "@/lib/constants";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { kitesurfingBookingUrl } from "@/lib/booking-url";
import Link from "next/link";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import white_logo from "@/public/images/fins-white-logo.svg";

const accent = "#38bdf8";

const linkColumns = [
  {
    title: "Kitesurfing",
    links: [
      { label: "Courses",      href: "/kitesurfing#courses" },
      { label: "Gear Rental",  href: "/kitesurfing#rental" },
      { label: "Storage",      href: "/kitesurfing#storage" },
      { label: "Book a course", href: kitesurfingBookingUrl(), external: true },
    ],
  },
  {
    title: "Day Use",
    links: [
      { label: "Beach & Lagoon", href: "/day-use" },
      { label: "Reservations",   href: "/day-use/booking" },
      { label: "Memberships",    href: "/kitesurfing#member" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Restaurant", href: "/restaurant" },
      { label: "About us",   href: "/about" },
    ],
  },
];

const footerLinkClass =
  "text-[0.8rem] font-[family-name:var(--font-raleway)] font-[300] text-white/55 hover:text-white transition-colors duration-200";

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-px w-5 flex-shrink-0" style={{ background: accent }} />
      <span
        className="text-[0.75rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)] font-[500]"
        style={{ color: accent }}
      >
        {children}
      </span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto text-white" style={{ background: "#0c1a2e" }}>
      <div className="max-w-7xl mx-auto px-8 md:px-14 lg:px-20 pt-16 pb-10">

        {/* Top: logo + tagline / link columns / contact */}
        <div className="grid grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr] gap-x-8 gap-y-12 pb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link href="/" className="w-fit">
              <Image src={white_logo} alt={APP_NAME} width={130} height={130} />
            </Link>
            <p className="text-[0.78rem] font-[family-name:var(--font-raleway)] font-[300] leading-relaxed text-white/45 max-w-[16rem]">
              IKO certified kite centre on the Red Sea — courses, rental, beach
              and restaurant in Sokhna.
            </p>
          </div>

          {/* Link columns */}
          {linkColumns.map(({ title, links }) => (
            <nav key={title} aria-label={title}>
              <ColumnTitle>{title}</ColumnTitle>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      /* Leaves for the school management app on another
                         domain — say so rather than ending the visit silently. */
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${footerLinkClass} inline-flex items-center gap-1.5`}
                      >
                        {label}
                        <ArrowUpRight
                          aria-hidden="true"
                          strokeWidth={1.5}
                          className="h-3.5 w-3.5"
                        />
                        <span className="sr-only">
                          (opens the booking site in a new tab)
                        </span>
                      </a>
                    ) : (
                      <Link href={href} className={footerLinkClass}>
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href={`https://wa.me/20${WHATSAPP_PHONE.substring(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerLinkClass} flex items-center gap-2.5`}
                >
                  <FaWhatsapp size={17} className="shrink-0" style={{ color: accent }} />
                  {WHATSAPP_PHONE}
                </Link>
              </li>
              <li>
                <Link
                  href={`mailto:${EMAIL_ADDRESS}`}
                  className={`${footerLinkClass} flex items-center gap-2.5`}
                >
                  <Mail size={17} className="shrink-0" style={{ color: accent }} />
                  {EMAIL_ADDRESS}
                </Link>
              </li>
              <li>
                <Link
                  href={LOCATION_ADDRESS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerLinkClass} flex items-center gap-2.5`}
                >
                  <MapPin size={17} className="shrink-0" style={{ color: accent }} />
                  Location
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-[0.75rem] font-[family-name:var(--font-raleway)] font-[300] tracking-[0.08em] text-white/35">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/45 hover:text-white transition-colors duration-200"
            >
              <FaInstagram size={19} />
            </Link>
            <Link
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/45 hover:text-white transition-colors duration-200"
            >
              <FaFacebook size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
