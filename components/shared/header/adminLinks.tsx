import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminLinks = [
  {
    title: "Bookings",
    href: "/bookings",
  },
  {
    title: "Bookings Dashboard",
    href: "/bookings/dashboard",
  },
  {
    title: "Open orders",
    href: "/accounting/open-orders",
  },
  {
    title: "Add Services",
    href: "/register",
  },
  {
    title: "Payments",
    href: "/accounting/payments",
  },
  {
    title: "Users",
    href: "/users",
  },
];

export function AdminLinks() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Admin</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {adminLinks.map((link) => (
            <DropdownMenuItem key={link.href}>
              <a href={link.href}>{link.title}</a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
