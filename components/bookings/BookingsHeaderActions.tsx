"use client";

import Link from "next/link";
import { Building2, Check, ChevronDown, Copy, Plus, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CopyGuestsButton,
  useCopyGuests,
} from "@/components/bookings/CopyGuestsButton";
import {
  getFilteredBookingGuests,
  type BookingsQuery,
} from "@/lib/actions/booking.actions";

/**
 * Bookings header actions.
 *
 * Below `sm` the three actions collapse into a single dropdown so the header
 * never overflows a 375px viewport. From `sm` up they render inline as before.
 */
export function BookingsHeaderActions({
  query,
  total,
}: {
  query: BookingsQuery;
  total: number;
}) {
  // The guest list is fetched on click for the whole filtered set, not just
  // the page of rows on screen.
  const loadGuests = () => getFilteredBookingGuests(query);
  const label = `Copy ${total} Guest${total === 1 ? "" : "s"}`;

  const { copied, isPending, copyGuests } = useCopyGuests(loadGuests);

  return (
    <>
      {/* ── Mobile: one dropdown ── */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-10 rounded-full bg-[#1a1614] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] text-white shadow-none hover:bg-[#2a2522] focus-visible:ring-[#1a1614]"
            >
              Actions
              <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]"
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                copyGuests();
              }}
              disabled={isPending}
              className="min-h-10 gap-2 rounded-md px-3 font-[family-name:var(--font-raleway)] text-sm text-[#1a1614] focus:bg-[#f5f2ef]"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#15803d]" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {isPending ? "Copying…" : label}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="min-h-10 gap-2 rounded-md px-3 font-[family-name:var(--font-raleway)] text-sm text-[#1a1614] focus:bg-[#f5f2ef]"
            >
              <Link href="/bookings/corporate/new">
                <Building2
                  className="h-4 w-4 text-[#6b6460]"
                  aria-hidden="true"
                />
                New Corporate
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="min-h-10 gap-2 rounded-md px-3 font-[family-name:var(--font-raleway)] text-sm text-[#1a1614] focus:bg-[#f5f2ef]"
            >
              <Link href="/bookings/day-use/new">
                <Sun className="h-4 w-4 text-[#b45309]" aria-hidden="true" />
                New Day Use
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Desktop: inline buttons ── */}
      <div className="hidden items-center gap-2 sm:flex">
        <CopyGuestsButton loadGuests={loadGuests} label={label} />
        <Button
          asChild
          variant="outline"
          className="min-h-11 rounded-full border-[#ece8e3] bg-white px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[600] text-[#5a5450] shadow-none hover:border-[#d6d0c8] hover:bg-[#f5f2ef] hover:text-[#1a1614] focus-visible:ring-[#1a1614]"
        >
          <Link href="/bookings/corporate/new">
            <Building2 className="size-4" aria-hidden="true" />
            New Corporate
          </Link>
        </Button>
        <Button
          asChild
          className="min-h-11 rounded-full bg-[#1a1614] px-4 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] text-white shadow-none hover:bg-[#2a2522] focus-visible:ring-[#1a1614]"
        >
          <Link href="/bookings/day-use/new">
            <Plus className="size-4" aria-hidden="true" />
            New Day Use
          </Link>
        </Button>
      </div>
    </>
  );
}
