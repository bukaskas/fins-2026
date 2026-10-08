import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ClipboardCheck, Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import logo from "../../../public/images/logo.png";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserAuthButton } from "./UserAuthButton";
import { AdminLinks, AdminLinksMobile, visibleGroupsForRole } from "./adminLinks";
import { NavItem } from "./NavItem";
import { roleHasCapability } from "@/lib/permissions";

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
      className="group relative text-neu-fg hover:text-neu-primary-ink text-[0.75rem] font-[500] tracking-[0.18em] uppercase font-[family-name:var(--font-raleway)] transition-colors duration-200"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 left-0 h-px w-0 bg-neu-primary group-hover:w-full transition-all duration-300 ease-out"
      />
    </Link>
  );
}

async function Menu() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  // Back-office dropdown shows for any role with at least one capability
  // (links are filtered per role inside AdminLinks).
  const adminGroups = visibleGroupsForRole(role);
  const hasBackOffice = adminGroups.length > 0;
  const isInstructor = role === "INSTRUCTOR" || (session?.user as any)?.isInstructor === true;
  const showMySchedule = isInstructor && role !== "ADMIN";
  // Roles that run the desk get a one-tap shortcut at the top of the sheet.
  const hasDesk = roleHasCapability(role, "bookings:manage");

  return (
    <div className="flex md:justify-center z-10 w-full">

      {/* ── DESKTOP ── */}
      {/* Three columns with equal side tracks keep the logo centred while the
          account cluster sits in flow, so it can never overlap the links (it
          used to be absolute right-5). Below lg there isn't room for links +
          cluster on both sides of a centred logo, so tablets get the sheet. */}
      <nav aria-label="Main" className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center py-3 px-5 w-full font-[family-name:var(--font-raleway)]">

        {/* Left links */}
        <div className="flex items-center justify-end gap-8">
          <NavLink href="/day-use">Day Use</NavLink>
          <NavLink href="/kitesurfing">Kitesurfing</NavLink>
        </div>

        {/* Logo — centred */}
        <Link className="flex flex-col items-center mx-6 flex-shrink-0" href="/">
          <Image
            src={logo}
            width={80}
            height={80}
            alt={APP_NAME}
          />
          <span className="text-[0.75rem] tracking-[0.28em] uppercase text-neu-muted font-[400] -mt-1 whitespace-nowrap">
            kite surfing center
          </span>
        </Link>

        {/* Right links + account cluster */}
        <div className="flex min-w-0 items-center gap-8">
          <NavLink href="/restaurant">Restaurant</NavLink>
          <NavLink href="/about">About</NavLink>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {hasBackOffice && <AdminLinks role={role} groups={adminGroups} showMySchedule={showMySchedule} />}
            <UserAuthButton session={session} compact />
          </div>
        </div>
      </nav>

      {/* ── MOBILE ── */}
      <nav aria-label="Main" className="lg:hidden flex justify-center items-center w-full py-3 px-4 relative">
        <Link className="flex flex-col items-center" href="/">
          <Image
            src={logo}
            width={72}
            height={72}
            alt={APP_NAME}
          />
        </Link>

        <Sheet>
          <SheetTrigger aria-label="Open menu" className="absolute right-2 size-11 flex items-center justify-center text-neu-fg hover:text-neu-primary-ink transition-colors cursor-pointer">
            <MenuIcon size={26} strokeWidth={1.5} />
          </SheetTrigger>

          <SheetContent
            side="right"
            className="[&>button:first-of-type]:hidden flex flex-col w-[280px] bg-neu-base text-neu-fg border-l-0 p-0"
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-neu-line/20">
              <SheetTitle className="text-xs tracking-[0.3em] uppercase font-[500] font-[family-name:var(--font-raleway)] text-neu-muted">
                Menu
              </SheetTitle>
              <SheetClose asChild>
                <button aria-label="Close menu" className="size-11 -mr-2 flex items-center justify-center rounded-xl text-neu-muted hover:text-neu-fg transition-colors cursor-pointer">
                  <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </SheetClose>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
              {/* Desk shortcut — staff open the sheet to get back to work, so
                  the desk sits above the marketing links, not below them. */}
              {hasDesk && (
                <div className="px-4 pt-4">
                  <NavItem
                    variant="sheet"
                    href="/reception"
                    className="min-h-12 gap-3 rounded-2xl text-base font-[600] tracking-[0.04em] shadow-(--shadow-neu-sm)"
                  >
                    <ClipboardCheck className="size-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                    Reception desk
                  </NavItem>
                </div>
              )}

              {/* Main nav links */}
              <div className="flex flex-col px-4 py-4 gap-0.5">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center px-3 py-3 text-lg font-[400] tracking-[0.1em] text-neu-fg hover:text-neu-primary-ink hover:bg-neu-inset rounded-xl transition-colors font-[family-name:var(--font-raleway)]"
                    >
                      {link.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              {/* Instructor schedule link (mobile) */}
              {showMySchedule && (
                <div className="px-4 pb-2">
                  <SheetClose asChild>
                    <Link
                      href="/my-schedule"
                      className="flex items-center px-3 py-3 text-lg font-[400] tracking-[0.1em] text-neu-fg hover:text-neu-primary-ink hover:bg-neu-inset rounded-xl transition-colors font-[family-name:var(--font-raleway)]"
                    >
                      My Schedule
                    </Link>
                  </SheetClose>
                </div>
              )}

              {/* Admin links (mobile) */}
              {hasBackOffice && <AdminLinksMobile role={role} groups={adminGroups} />}
            </div>

            {/* Auth at the bottom */}
            <div className="border-t border-neu-line/20 px-4 py-5">
              <UserAuthButton
                session={session}
                className="w-full justify-start text-base font-[400] tracking-wide text-neu-fg hover:text-neu-primary-ink hover:bg-neu-inset h-11 px-3"
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
