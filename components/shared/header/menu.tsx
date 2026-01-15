import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { EllipsisVertical, ShoppingCart, UserIcon } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import logo from "../../../public/images/logo.svg";
import { X } from "lucide-react";

const links = [
  {
    title: "Day use",
    href: "/day-use",
  },
  {
    title: "Kitesurfing",
    href: "/kitesurfing",
  },
  {
    title: "About",
    href: "/about",
  },
];

function Menu() {
  return (
    <div className="flex md:justify-center z-10 w-full">
      <nav className="hidden md:flex md:items-center md:justify-center gap-6 font-[family-name:var(--font-raleway)]">
        <Button asChild variant={"ghost"} className="text-lg">
          <Link href="/about">About</Link>
        </Button>

        <Button asChild variant={"ghost"} className="text-lg">
          <Link href="/kitesurfing">Kitesurfing</Link>
        </Button>

        {/* Image */}
        <Link className="flex flex-col items-center" href="/">
          <Image
            className="rounded-full"
            src={logo}
            width={84}
            height={84}
            alt={`${APP_NAME}`}
          />
          <span className="hidden lg:block text-2xl whitespace-nowrap font-[family-name:var(--font-raleway)]">
            kite surfing center
          </span>
        </Link>
        <Button asChild variant={"ghost"} className="text-lg">
          <Link href="/day-use">Day Use</Link>
        </Button>
        <Button asChild variant={"ghost"} className="text-lg">
          <Link href="/day-use">Restaurant</Link>
        </Button>
      </nav>
      <nav className="md:hidden flex justify-center w-full p-4 relative">
        <Link className="flex flex-col items-center" href="/">
          <Image
            className="rounded-full"
            src={logo}
            width={84}
            height={84}
            alt={`${APP_NAME}`}
          />
          <span className="hidden lg:block text-2xl whitespace-nowrap font-[family-name:var(--font-raleway)]">
            kite surfing center
          </span>
        </Link>
        <Sheet>
          <SheetTrigger className="absolute right-4">
            <EllipsisVertical size={40} />
          </SheetTrigger>
          <SheetContent className="[&>button:first-of-type]:hidden flex flex-col items-stretch py-8 px-6 w-[300px]">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-8">
              <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
              <SheetClose asChild>
                <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </SheetClose>
            </div>

            {/* Main navigation links - larger and full width */}
            <div className="flex flex-col gap-2 mb-6">
              {links.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Button
                    asChild
                    variant={"ghost"}
                    className="w-full justify-start text-xl h-14 px-4 hover:bg-primary/10 font-[family-name:var(--font-raleway)]"
                  >
                    <Link href={link.href}>{link.title}</Link>
                  </Button>
                </SheetClose>
              ))}
            </div>

            {/* Secondary actions - separator and smaller */}
            <div className="border-t pt-4 mt-auto flex flex-col gap-2">
              <SheetClose asChild>
                <Button
                  asChild
                  variant={"ghost"}
                  className="w-full justify-start text-lg h-12 px-4"
                >
                  <Link href="/cart">
                    <ShoppingCart className="mr-2" /> Cart
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  asChild
                  variant={"ghost"}
                  className="w-full justify-start text-lg h-12 px-4"
                >
                  <Link href="/sign-in">
                    <UserIcon className="mr-2" /> Sign In
                  </Link>
                </Button>
              </SheetClose>
            </div>

            <SheetDescription className="sr-only">
              Navigation menu
            </SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

export default Menu;
