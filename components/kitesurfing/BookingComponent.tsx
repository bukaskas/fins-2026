"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking } from "@prisma/client";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { Users, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateBookingStatus } from "@/lib/actions/booking.actions";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-label="WhatsApp"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const STATUS_BORDER: Record<BookingStatus, string> = {
  PENDING: "#f59e0b",
  REQUEST_SENT: "#38bdf8",
  UNDER_REVIEW: "#fb923c",
  WAITING_PAYMENT: "#a78bfa",
  CONFIRMED: "#22c55e",
  DECLINED: "#ef4444",
  NO_RESPONSE_EXPIRED: "#9ca3af",
  CANCELED: "#d1d5db",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  REQUEST_SENT: "Request Sent",
  UNDER_REVIEW: "Under Review",
  WAITING_PAYMENT: "Waiting Payment",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  NO_RESPONSE_EXPIRED: "No Response",
  CANCELED: "Canceled",
};

const ALL_STATUSES = Object.values(BookingStatus);

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  DEPOSIT_PAID: "Deposit",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  UNPAID: "#9ca3af",
  DEPOSIT_PAID: "#60a5fa",
  PAID: "#22c55e",
  REFUNDED: "#c084fc",
};

function fmtEGP(cents: number): string {
  return `${(cents / 100).toLocaleString("en-EG")} EGP`;
}

function buildWaData(booking: Booking) {
  const phone = booking.phone.replace(/\D/g, "");
  const name = booking.name;

  const instagramText =
    `Hi ${name}! As part of our booking confirmation, could you please share your Instagram account? ` +
    `This helps us keep our Fins community the way we love it 🤍 If your account is private, a screenshot works just fine!`;

  const paymentInfo =
    `💳 *To confirm your reservation:*\n` +
    `Please send a *50% deposit*\n\n` +
    `⚠️ Deposit is *non-refundable* and reservations *cannot be postponed.*\n\n` +
    `🏦 *Bank:* Arab African International Bank\n` +
    `🔢 *Account No:* 1105202510010201\n` +
    `👤 *Account Name:* Fins Kite Surfing\n\n` +
    `After payment, please send a *screenshot of the transaction* with full details. Thank you`;

  const amountLines =
    booking.totalPriceCents != null
      ? `Total: ${fmtEGP(booking.totalPriceCents)}\n` +
        `Deposit amount: ${fmtEGP(Math.round(booking.totalPriceCents / 2))}\n\n`
      : "";

  const depositText = `${amountLines}Payment info:\n${paymentInfo}`;

  return {
    instagramText,
    depositText,
    plainWa: `https://wa.me/${phone}`,
  };
}

function BookingComponent({ booking }: { booking: Booking }) {
  const [status, setStatus] = useState<BookingStatus>(booking.bookingStatus);
  const [isPending, setIsPending] = useState(false);

  const dateObj = new Date(booking.date);
  const day = dateObj.getUTCDate();
  const month = dateObj.getUTCMonth() + 1;

  const borderColor = STATUS_BORDER[status];
  const waData = buildWaData(booking);

  async function handleStatusChange(next: BookingStatus) {
    const prev = status;
    setStatus(next);
    setIsPending(true);
    const result = await updateBookingStatus(booking.id, next);
    setIsPending(false);
    if (!result.success) {
      setStatus(prev);
      toast.error("Failed to update status");
    }
  }

  return (
    <div
      className="group flex items-stretch bg-white border border-[#ece8e3] hover:border-[#d6d0c8] hover:bg-[#faf9f7] transition-all duration-150"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Time column — also holds the mobile status trigger */}
      <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-[#ece8e3] px-2 gap-1.5">
        <span className="font-[family-name:var(--font-roboto)] text-[0.65rem] text-[#8a8480] tabular-nums">
          {booking.time ?? "—"}
        </span>
        {/* Mobile-only status dot — opens the same dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isPending}
                className="w-3 h-3 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: borderColor }}
                title={STATUS_LABEL[status]}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => handleStatusChange(s)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: STATUS_BORDER[s] }}
                  />
                  <span className="text-[0.72rem]">{STATUS_LABEL[s]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date */}
      <div className="hidden sm:flex items-center justify-center w-12 shrink-0 border-r border-[#ece8e3] px-2">
        <span className="font-[family-name:var(--font-raleway)] text-[0.65rem] font-[600] text-[#8a8480] tabular-nums">
          {day}/{month}
        </span>
      </div>

      {/* Name + people */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
        <span className="font-[family-name:var(--font-raleway)] font-[500] text-[0.88rem] text-[#1a1614] truncate">
          {booking.name}
        </span>
        <span className="flex items-center gap-1 text-[#8a8480] shrink-0">
          <Users className="h-3 w-3" />
          <span className="font-[family-name:var(--font-raleway)] text-[0.72rem]">
            {booking.numberOfPeople}
          </span>
        </span>
      </div>

      {/* Status + payment */}
      <div className="hidden md:flex items-center gap-3 px-4 border-l border-[#ece8e3]">
        {/* Inline status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isPending}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity duration-150 disabled:opacity-40"
              title="Change status"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: borderColor }}
              />
              <span className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.08em] uppercase font-[500] text-[#5a5450]">
                {STATUS_LABEL[status]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {ALL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() => handleStatusChange(s)}
                className="flex items-center gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: STATUS_BORDER[s] }}
                />
                <span className="text-[0.72rem]">{STATUS_LABEL[s]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-[#d6d0c8]">·</span>
        <span
          className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.08em] uppercase font-[500]"
          style={{ color: PAYMENT_COLOR[booking.paymentStatus] }}
        >
          {PAYMENT_LABEL[booking.paymentStatus]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 border-l border-[#ece8e3]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center w-7 h-7 text-[#22c55e] hover:bg-green-50 rounded transition-colors duration-150"
              title="WhatsApp actions"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onSelect={() => {
                navigator.clipboard.writeText(waData.instagramText);
                toast.success("Copied!");
              }}
            >
              Copy Instagram message
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                navigator.clipboard.writeText(waData.depositText);
                toast.success("Copied!");
              }}
            >
              Copy Deposit message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={waData.plainWa}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open WhatsApp
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center w-7 h-7 text-[#3b82f6] hover:bg-blue-50 rounded transition-colors duration-150"
          title="Call"
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
        <Link
          href={`/bookings/${booking.id}/edit`}
          className="flex items-center justify-center w-7 h-7 text-[#8a8480] hover:text-[#1a1614] hover:bg-[#f0ece8] rounded transition-colors duration-150"
          title="Edit booking"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default BookingComponent;
