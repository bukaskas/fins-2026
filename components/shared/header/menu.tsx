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
];

function Menu() {
  return (
    <div className="flex md:justify-center z-10 w-full">
      <nav className="hidden md:flex md:items-center md:justify-center gap-6 font-[family-name:var(--font-raleway)]">
        <Button asChild variant={"ghost"} className="text-lg">
          <Link href="/day-use">About</Link>
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
          <SheetContent className="[&>button:first-of-type]:hidden flex flex-col items-end py-4 px-4 ">
            <SheetTitle className="self-center">Menu</SheetTitle>
            <SheetClose asChild>
              <button className="h-12 w-12 rounded-full flex items-center justify-center hover:bg-muted">
                <X className="h-6 w-6" />
              </button>
            </SheetClose>
            {links.map((link) => (
              <Button key={link.href} asChild variant={"ghost"}>
                <Link href={link.href}>{link.title}</Link>
              </Button>
            ))}
            <Button asChild variant={"ghost"}>
              <Link href="/cart">
                <ShoppingCart /> Cart
              </Link>
            </Button>
            <Button asChild variant={"ghost"}>
              <Link href="/sign-in">
                <UserIcon /> Sign In
              </Link>
            </Button>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

export default Menu;
