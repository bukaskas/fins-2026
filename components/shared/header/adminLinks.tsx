import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetClose } from "@/components/ui/sheet";
import Link from "next/link";

const adminGroups = [
  {
    label: "Bookings",
    links: [
      { title: "All Bookings", href: "/bookings" },
      { title: "Dashboard",    href: "/bookings/dashboard" },
      { title: "Schedule",     href: "/bookings/schedule" },
      { title: "Guide",        href: "/bookings/guide" },
    ],
  },
  {
    label: "Finance",
    links: [
      { title: "Open Orders", href: "/accounting/open-orders" },
      { title: "Payments",    href: "/accounting/payments" },
    ],
  },
  {
    label: "Operations",
    links: [
      { title: "Add Services", href: "/register" },
      { title: "Rentals",      href: "/rentals" },
      { title: "Rental Guide", href: "/rentals/guide" },
      { title: "Inventory",    href: "/inventory" },
    ],
  },
  {
    label: "People",
    links: [
      { title: "Users", href: "/users" },
    ],
  },
];

/** Desktop: grouped dropdown menu */
export function AdminLinks() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-8 rounded-none border-gray-300/70 text-gray-700 hover:bg-gray-100/80 text-[0.68rem] tracking-[0.15em] uppercase font-[300] font-[family-name:var(--font-raleway)] px-4"
        >
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        {adminGroups.map((group, groupIndex) => (
          <span key={group.label}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                {group.label}
              </DropdownMenuLabel>
              {group.links.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile: flat grouped list for use inside the Sheet — each link closes the sheet */
export function AdminLinksMobile() {
  return (
    <div className="flex flex-col border-t border-white/8 pt-4 px-4 pb-2">
      <p className="px-3 pb-2 text-[0.58rem] tracking-[0.35em] uppercase text-white/30 font-[family-name:var(--font-raleway)] font-[300]">
        Admin
      </p>
      {adminGroups.map((group, groupIndex) => (
        <div key={group.label}>
          {groupIndex > 0 && <div className="my-1 border-t border-white/6" />}
          <p className="px-3 pt-1.5 pb-0.5 text-[0.58rem] tracking-[0.25em] uppercase text-white/25 font-[family-name:var(--font-raleway)]">
            {group.label}
          </p>
          {group.links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="flex w-full items-center px-3 py-2 text-sm font-[300] tracking-wide text-white/65 hover:text-white hover:bg-white/5 rounded-sm transition-colors font-[family-name:var(--font-raleway)]"
              >
                {link.title}
              </Link>
            </SheetClose>
          ))}
        </div>
      ))}
    </div>
  );
}
