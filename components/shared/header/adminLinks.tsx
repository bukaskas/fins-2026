import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Fragment } from "react";
import { NavItem } from "./NavItem";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { roleHasCapability, type Capability } from "@/lib/permissions";

type NavLinkDef = {
  title: string;
  href: string;
  capability: Capability;
  /** Highlight only on this exact path, not on its child routes. */
  exact?: boolean;
};
export type NavGroup = { label: string; links: NavLinkDef[] };

// Back-office nav. Each link names the capability that gates its page
// (mirrors proxy.ts) so every role sees exactly what it can open.
const adminGroups: NavGroup[] = [
  {
    label: "Front desk",
    links: [
      { title: "Reception desk",    href: "/reception",          capability: "bookings:manage" },
      { title: "All bookings",      href: "/bookings",           capability: "bookings:manage", exact: true },
      { title: "Bookings calendar", href: "/bookings/dashboard", capability: "bookings:manage" },
    ],
  },
  {
    label: "Kitesurfing",
    links: [
      { title: "New kite service", href: "/register",          capability: "desk:checkin" },
      { title: "Lesson schedule",  href: "/bookings/schedule", capability: "lessons:view" },
      { title: "Rentals",          href: "/rentals",           capability: "rentals:manage" },
      { title: "Inventory",        href: "/inventory",         capability: "inventory:manage" },
    ],
  },
  {
    label: "Finance",
    links: [
      { title: "Open orders", href: "/accounting/open-orders", capability: "desk:collect" },
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

// Neumorphic dropdown surface — admin scope (MASTER.md): raised-sm shadow max.
// Item styling lives in NavItem.
// Shared by the dropdown and the mobile sheet so the two read as one menu.
const groupLabelClass =
  "px-3 pt-2 pb-1 text-xs font-[600] tracking-[0.2em] uppercase text-neu-muted font-[family-name:var(--font-raleway)]";
const separatorClass = "my-1.5 h-px bg-neu-line/25";

const contentClass =
  "w-56 rounded-2xl border-0 bg-neu-base p-2 text-neu-fg shadow-(--shadow-neu-sm)";

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
export function AdminLinks({
  role,
  groups,
  showMySchedule = false,
}: {
  role: string | null | undefined;
  groups: NavGroup[];
  /** Instructors' own schedule — lives in the menu so the header row stays short. */
  showMySchedule?: boolean;
}) {
  if (groups.length === 0) return null;
  const label = role === "RECEPTION" ? "Desk" : "Admin";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="group h-10 gap-1.5 rounded-xl border-neu-line/30 bg-transparent text-neu-fg hover:bg-neu-inset hover:text-neu-fg text-[0.75rem] tracking-[0.15em] uppercase font-[500] font-[family-name:var(--font-raleway)] pl-4 pr-3 data-[state=open]:bg-neu-inset"
        >
          {label}
          <ChevronDown
            className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={contentClass}
      >
        {showMySchedule && (
          <>
            <NavItem variant="menu" href="/my-schedule">
              My schedule
            </NavItem>
            <DropdownMenuSeparator className={cn("mx-0", separatorClass)} />
          </>
        )}
        {groups.map((group, groupIndex) => (
          <Fragment key={group.label}>
            {groupIndex > 0 && (
              <DropdownMenuSeparator className={cn("mx-0", separatorClass)} />
            )}
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {group.label}
              </DropdownMenuLabel>
              {group.links.map((link) => (
                <NavItem key={link.href} variant="menu" href={link.href} exact={link.exact}>
                  {link.title}
                </NavItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile: flat grouped list for use inside the Sheet — each link closes the sheet */
export function AdminLinksMobile({
  role,
  groups,
}: {
  role: string | null | undefined;
  groups: NavGroup[];
}) {
  if (groups.length === 0) return null;
  const label = role === "RECEPTION" ? "Desk" : "Admin";
  return (
    <div className="flex flex-col border-t border-neu-line/20 pt-4 px-4 pb-2">
      {/* Section title outranks the group labels: full-strength ink, not muted. */}
      <p className="px-3 pb-1 text-xs font-[600] tracking-[0.2em] uppercase text-neu-fg font-[family-name:var(--font-raleway)]">
        {label}
      </p>
      {groups.map((group, groupIndex) => (
        <div key={group.label}>
          {groupIndex > 0 && <div aria-hidden="true" className={separatorClass} />}
          <p className={groupLabelClass}>
            {group.label}
          </p>
          {group.links.map((link) => (
            <NavItem key={link.href} variant="sheet" href={link.href} exact={link.exact}>
              {link.title}
            </NavItem>
          ))}
        </div>
      ))}
    </div>
  );
}
