"use client";

import Link from "next/link";
import { Check, ChevronDown, Copy, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyGuestsButton, useCopyGuests } from "@/components/bookings/CopyGuestsButton";
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
            <Button size="sm" className="rounded-full h-10 px-4">
              Actions
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                copyGuests();
              }}
              disabled={isPending}
              className="gap-2 py-2.5"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#15803d]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {isPending ? "Copying…" : label}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 py-2.5">
              <Link href="/bookings/corporate/new">
                <Plus className="h-4 w-4" />
                New Corporate
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 py-2.5">
              <Link href="/bookings/day-use/new">
                <Plus className="h-4 w-4" />
                New Day Use
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Desktop: inline buttons ── */}
      <div className="hidden sm:flex items-center gap-2">
        <CopyGuestsButton loadGuests={loadGuests} label={label} />
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/bookings/corporate/new">+ New Corporate</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link href="/bookings/day-use/new">+ New Day Use</Link>
        </Button>
      </div>
    </>
  );
}
