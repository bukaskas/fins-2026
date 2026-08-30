"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Gauge,
  GraduationCap,
  Store,
  Users,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OTHER_VIEWS = [
  { label: "Dashboard", href: "/bookings/dashboard", icon: Gauge },
  { label: "Agents", href: "/bookings/agents", icon: Users },
  { label: "Kitesurfing", href: "/bookings/kitesurfing", icon: Waves },
  { label: "Lessons", href: "/lessons", icon: GraduationCap },
  { label: "Day Use", href: "/bookings/day-use", icon: CalendarDays },
  { label: "Restaurant", href: "/bookings/restaurant", icon: Store },
];

export function BookingsNavigation() {
  return (
    <nav
      aria-label="Booking views"
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        asChild
        variant="outline"
        className="min-h-11 rounded-full border-[#ece8e3] bg-transparent px-4 font-[family-name:var(--font-raleway)] text-xs font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-white hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
      >
        <Link href="/bookings/schedule">
          <CalendarDays className="size-4" aria-hidden="true" />
          Schedule
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="min-h-11 rounded-full border-[#ece8e3] bg-transparent px-4 font-[family-name:var(--font-raleway)] text-xs font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-white hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
      >
        <Link href="/bookings/payments">
          <CircleDollarSign className="size-4" aria-hidden="true" />
          Deposits
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-h-11 rounded-full border-[#ece8e3] bg-transparent px-4 font-[family-name:var(--font-raleway)] text-xs font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-white hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
            aria-label="Open more booking views"
          >
            More
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-52 rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]"
        >
          {OTHER_VIEWS.map(({ label, href, icon: Icon }) => (
            <DropdownMenuItem
              key={href}
              asChild
              className="min-h-10 rounded-md px-3 font-[family-name:var(--font-raleway)] text-sm text-[#1a1614] focus:bg-[#f5f2ef]"
            >
              <Link href={href}>
                <Icon className="size-4 text-[#6b6460]" aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
