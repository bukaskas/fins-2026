import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import logo from "../../../public/images/logo.svg";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserAuthButton } from "./UserAuthButton";
import { AdminLinks, AdminLinksMobile } from "./adminLinks";

const links = [
  { title: "Day Use",      href: "/day-use" },
  { title: "Kitesurfing",  href: "/kitesurfing" },
  { title: "Restaurant",   href: "/restaurant" },
  { title: "About",        href: "/about" },
];

/** Underline-grow nav link for desktop */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative text-gray-800 hover:text-gray-950 text-[0.72rem] font-[300] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] transition-colors duration-200"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gray-800 group-hover:w-full transition-all duration-300 ease-out" />
    </Link>
  );
}

async function Menu() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";
  const isInstructor = role === "INSTRUCTOR" || (session?.user as any)?.isInstructor === true;

  return (
    <div className="flex md:justify-center z-10 w-full">

      {/* ── DESKTOP ── */}
      <nav className="hidden md:flex md:items-center md:justify-center gap-6 lg:gap-10 py-3 w-full font-[family-name:var(--font-raleway)]">

        {/* Left links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink href="/day-use">Day Use</NavLink>
          <NavLink href="/kitesurfing">Kitesurfing</NavLink>
        </div>

        {/* Logo — centred */}
        <Link className="flex flex-col items-center mx-4 lg:mx-6 flex-shrink-0" href="/">
          <Image
            className="rounded-full"
            src={logo}
            width={80}
            height={80}
            alt={APP_NAME}
          />
          <span className="hidden lg:block text-[0.55rem] tracking-[0.28em] uppercase text-gray-500 font-[300] -mt-1 whitespace-nowrap">
            kite surfing center
          </span>
        </Link>

        {/* Right links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink href="/restaurant">Restaurant</NavLink>
          <NavLink href="/about">About</NavLink>
        </div>

        {/* Admin + Auth — pushed right */}
        <div className="absolute right-5 flex items-center gap-3">
          {isInstructor && !isAdmin && (
            <Link
              href="/my-schedule"
              className="text-[0.72rem] font-[300] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] text-gray-800 hover:text-gray-950 transition-colors"
            >
              My Schedule
            </Link>
          )}
          {isAdmin && <AdminLinks />}
          <UserAuthButton session={session} />
        </div>
      </nav>

      {/* ── MOBILE ── */}
      <nav className="md:hidden flex justify-center items-center w-full py-3 px-4 relative">
        <Link className="flex flex-col items-center" href="/">
          <Image
            className="rounded-full"
            src={logo}
            width={72}
            height={72}
            alt={APP_NAME}
          />
        </Link>

        <Sheet>
          <SheetTrigger className="absolute right-4 p-1 text-gray-800 hover:text-gray-950 transition-colors">
            <MenuIcon size={26} strokeWidth={1.5} />
          </SheetTrigger>

          <SheetContent
            side="right"
            className="[&>button:first-of-type]:hidden flex flex-col w-[280px] bg-zinc-950 text-white border-l border-white/8 p-0"
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-white/8">
              <SheetTitle className="text-xs tracking-[0.3em] uppercase font-[300] font-[family-name:var(--font-raleway)] text-white/60">
                Menu
              </SheetTitle>
              <SheetClose asChild>
                <button className="h-8 w-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </SheetClose>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
              {/* Main nav links */}
              <div className="flex flex-col px-4 py-4 gap-0.5">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center px-3 py-3 text-lg font-[300] tracking-[0.1em] text-white/80 hover:text-white hover:bg-white/5 rounded-sm transition-colors font-[family-name:var(--font-raleway)]"
                    >
                      {link.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              {/* Instructor schedule link (mobile) */}
              {isInstructor && !isAdmin && (
                <div className="px-4 pb-2">
                  <SheetClose asChild>
                    <Link
                      href="/my-schedule"
                      className="flex items-center px-3 py-3 text-lg font-[300] tracking-[0.1em] text-white/80 hover:text-white hover:bg-white/5 rounded-sm transition-colors font-[family-name:var(--font-raleway)]"
                    >
                      My Schedule
                    </Link>
                  </SheetClose>
                </div>
              )}

              {/* Admin links (mobile) */}
              {isAdmin && <AdminLinksMobile />}
            </div>

            {/* Auth at the bottom */}
            <div className="border-t border-white/8 px-4 py-5">
              <UserAuthButton
                session={session}
                className="w-full justify-start text-base font-[300] tracking-wide text-white/70 hover:text-white hover:bg-white/5 h-11 px-3"
              />
            </div>

            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>

    </div>
  );
}

export default Menu;
