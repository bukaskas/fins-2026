"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, Mail, Plus, UserX } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FOCUS_RING } from "@/lib/bookings/status";
import { FullyBookedDialog } from "./FullyBookedDialog";
import { useCopySummary } from "./useCopySummary";

type Props = {
  date: string;
  dateLabel: string;
  pendingCount: number;
  summaryText: string;
  /** "menu" is the phone dropdown (below `sm`); "inline" is the button row. */
  mode: "menu" | "inline";
};

const OUTLINE_BUTTON = `inline-flex min-h-11 items-center gap-2 border border-[#d6d0c8] text-[#5b5650] text-[0.72rem] font-[600] tracking-[0.14em] uppercase px-4 font-[family-name:var(--font-raleway)] transition-colors duration-200 hover:border-[#8a8480] hover:text-[#1a1614] ${FOCUS_RING}`;

const MENU_ITEM =
  "min-h-11 gap-2.5 rounded-md px-3 font-[family-name:var(--font-raleway)] text-sm text-[#1a1614] focus:bg-[#f5f2ef]";

/**
 * Header actions for a single date. Below `sm` the four actions collapse into
 * one dropdown so the header never overflows a phone; from `sm` up they render
 * inline. Same pattern as `components/bookings/BookingsHeaderActions.tsx`.
 */
export function DateHeaderActions({
  date,
  dateLabel,
  pendingCount,
  summaryText,
  mode,
}: Props) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { copied, copy } = useCopySummary(summaryText);
  const noPending = pendingCount === 0;
  // Counts PENDING only, not the wider Pending tab (which adds Request Sent and
  // Under Review), so the label says "new requests" to match what gets canceled.
  const cancelLabel = noPending
    ? "No new requests"
    : `Cancel ${pendingCount} new ${pendingCount === 1 ? "request" : "requests"}`;

  const dialog = (
    <FullyBookedDialog
      date={date}
      dateLabel={dateLabel}
      pendingCount={pendingCount}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      returnFocusRef={mode === "menu" ? triggerRef : undefined}
    />
  );

  // Announced to screen readers; the visible "Copied" swap alone is silent.
  const copiedAnnouncement = (
    <span role="status" aria-live="polite" className="sr-only">
      {copied ? "Summary copied to clipboard" : ""}
    </span>
  );

  if (mode === "menu") {
    return (
      <div className="sm:hidden">
        {/* Non-modal so the menu and the dialog it opens don't both lock the page. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            ref={triggerRef}
            className={`inline-flex h-11 items-center gap-1 rounded-full bg-[#1a1614] px-5 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] text-white transition-colors duration-200 hover:bg-[#2a2522] ${FOCUS_RING}`}
          >
            Actions
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]"
          >
            <DropdownMenuItem asChild className={MENU_ITEM}>
              <Link href="/bookings/day-use/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Booking
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={MENU_ITEM}>
              <Link href={`/bookings/bulkemail?date=${date}`}>
                <Mail className="h-4 w-4 text-[#6b6460]" aria-hidden="true" />
                Bulk email
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              // Keep the menu open so "Copied" is visible.
              onSelect={(e) => {
                e.preventDefault();
                void copy();
              }}
              className={MENU_ITEM}
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#15803d]" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4 text-[#6b6460]" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy summary"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={noPending}
              onSelect={() => setDialogOpen(true)}
              className={`${MENU_ITEM} text-[#b91c1c] focus:bg-[#fef2f2] focus:text-[#991b1b]`}
            >
              <UserX className="h-4 w-4" aria-hidden="true" />
              {cancelLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dialog}
        {copiedAnnouncement}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <button
        type="button"
        onClick={() => void copy()}
        className={`inline-flex min-h-11 items-center gap-1.5 border border-[#ece8e3] bg-white text-[#6b6460] font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.12em] uppercase font-[600] px-4 rounded-full hover:border-[#d6d0c8] hover:text-[#1a1614] transition-colors duration-150 shrink-0 ${FOCUS_RING}`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[#15803d]" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy summary"}
      </button>
      <Link href={`/bookings/bulkemail?date=${date}`} className={OUTLINE_BUTTON}>
        Bulk email
      </Link>
      <Link
        href="/bookings/day-use/new"
        className={`inline-flex min-h-11 items-center gap-2 bg-[#1a1614] text-white text-[0.72rem] font-[700] tracking-[0.14em] uppercase px-5 font-[family-name:var(--font-raleway)] hover:bg-[#2a2420] transition-colors duration-200 ${FOCUS_RING}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        New Booking
      </Link>
      {/* Destructive, so it sits last and apart from the everyday actions. */}
      <button
        type="button"
        disabled={noPending}
        onClick={() => setDialogOpen(true)}
        title={noPending ? "No new requests on this date" : "Email “fully booked” and cancel"}
        className={`ml-2 inline-flex min-h-11 items-center gap-2 border border-[#fca5a5] text-[#b91c1c] text-[0.72rem] font-[600] tracking-[0.14em] uppercase px-4 font-[family-name:var(--font-raleway)] transition-colors duration-200 hover:border-[#b91c1c] hover:bg-[#fef2f2] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#fca5a5] disabled:hover:bg-transparent ${FOCUS_RING}`}
      >
        <UserX className="h-3.5 w-3.5" aria-hidden="true" />
        {cancelLabel}
      </button>
      {dialog}
      {copiedAnnouncement}
    </div>
  );
}
