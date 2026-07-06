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

import { roleHasCapability, type Capability } from "@/lib/permissions";

type NavLinkDef = { title: string; href: string; capability: Capability };
type NavGroup = { label: string; links: NavLinkDef[] };

// Back-office nav. Each link names the capability that gates its page
// (mirrors proxy.ts) so every role sees exactly what it can open.
const adminGroups: NavGroup[] = [
  {
    label: "Day Use",
    links: [
      { title: "Reception Desk", href: "/reception",          capability: "bookings:manage" },
      { title: "All Bookings",   href: "/bookings",           capability: "bookings:manage" },
      { title: "Dashboard",      href: "/bookings/dashboard", capability: "bookings:manage" },
    ],
  },
  {
    label: "Kitesurfing",
    links: [
      { title: "+ Kite Service", href: "/register",          capability: "desk:checkin" },
      { title: "Lessons",        href: "/bookings/schedule", capability: "lessons:view" },
      { title: "Rentals",        href: "/rentals",           capability: "rentals:manage" },
      { title: "Inventory",      href: "/inventory",         capability: "inventory:manage" },
      { title: "Rental Guide",   href: "/rentals/guide",     capability: "rentals:manage" },
    ],
  },
  {
    label: "Finance",
    links: [
      { title: "Open Orders", href: "/accounting/open-orders", capability: "desk:collect" },
      { title: "Payments",    href: "/accounting/payments",    capability: "accounting:manage" },
      { title: "Expenses",    href: "/accounting/expenses",    capability: "accounting:manage" },
      { title: "Products",    href: "/products",               capability: "products:manage" },
    ],
  },
  {
    label: "People",
    links: [
      { title: "Users",       href: "/users",       capability: "users:admin" },
      { title: "Instructors", href: "/instructors", capability: "instructors:manage" },
    ],
  },
];

/** Groups visible to a role, with links the role can't open filtered out. */
export function visibleGroupsForRole(role: string | null | undefined): NavGroup[] {
  return adminGroups
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => roleHasCapability(role, l.capability)),
    }))
    .filter((g) => g.links.length > 0);
}

/** Desktop: grouped dropdown menu */
export function AdminLinks({ role }: { role: string | null | undefined }) {
  const groups = visibleGroupsForRole(role);
  if (groups.length === 0) return null;
  const label = role === "RECEPTION" ? "Desk" : "Admin";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          suppressHydrationWarning
          variant="outline"
          className="h-8 rounded-none border-gray-300/70 text-gray-700 hover:bg-gray-100/80 text-[0.68rem] tracking-[0.15em] uppercase font-[300] font-[family-name:var(--font-raleway)] px-4"
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        {groups.map((group, groupIndex) => (
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
export function AdminLinksMobile({ role }: { role: string | null | undefined }) {
  const groups = visibleGroupsForRole(role);
  if (groups.length === 0) return null;
  const label = role === "RECEPTION" ? "Desk" : "Admin";
  return (
    <div className="flex flex-col border-t border-white/8 pt-4 px-4 pb-2">
      <p className="px-3 pb-2 text-[0.58rem] tracking-[0.35em] uppercase text-white/30 font-[family-name:var(--font-raleway)] font-[300]">
        {label}
      </p>
      {groups.map((group, groupIndex) => (
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
