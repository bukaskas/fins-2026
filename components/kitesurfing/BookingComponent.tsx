"use client";

import { useState } from "react";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { Users, Pencil, Phone, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookingWithAgent } from "@/lib/actions/booking.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateBookingStatus, updateBookingAmountPaid, assignBookingAgent } from "@/lib/actions/booking.actions";

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
  PENDING:             "#f59e0b",
  REQUEST_SENT:        "#38bdf8",
  UNDER_REVIEW:        "#fb923c",
  WAITING_PAYMENT:     "#a78bfa",
  CONFIRMED:           "#22c55e",
  ARRIVED:             "#14b8a6",
  DECLINED:            "#ef4444",
  NO_RESPONSE_EXPIRED: "#9ca3af",
  CANCELED:            "#d1d5db",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING:             "Pending",
  REQUEST_SENT:        "Request Sent",
  UNDER_REVIEW:        "Under Review",
  WAITING_PAYMENT:     "Waiting Payment",
  CONFIRMED:           "Confirmed",
  ARRIVED:             "Arrived",
  DECLINED:            "Declined",
  NO_RESPONSE_EXPIRED: "No Response",
  CANCELED:            "Canceled",
};

const ALL_STATUSES = Object.values(BookingStatus);

const SERVICE_META: Record<string, { dot: string; label: string }> = {
  "kitesurfing-course": { dot: "#38bdf8", label: "Kitesurfing" },
  "day-use":            { dot: "#fbbf24", label: "Day Use" },
  "restaurant":         { dot: "#fb923c", label: "Restaurant" },
  "pharaoh-airstyle":   { dot: "#e879f9", label: "Pharaoh" },
};

function fmtEGP(cents: number): string {
  return `${(cents / 100).toLocaleString("en-EG")} EGP`;
}

type UserStub = { id: string; name: string | null; email: string };

function buildWaData(booking: BookingWithAgent) {
  const phone = booking.phone.replace(/\D/g, "");
  const name = booking.name;

  const instagramText =
    `Hi ${name}! As part of our booking confirmation, could you please share the Instagram accounts of everyone in your group? ` +
    `This helps us keep our Fins community the way we love it 🤍 If any profiles are private, a screenshot works just fine!`;

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

  return { instagramText, depositText, plainWa: `https://wa.me/${phone}` };
}

function BookingComponent({ booking, allUsers }: { booking: BookingWithAgent; allUsers: UserStub[] }) {
  const [status, setStatus]           = useState<BookingStatus>(booking.bookingStatus);
  const [isPending, setIsPending]     = useState(false);
  const [amountPaid, setAmountPaid]   = useState(booking.amountPaidCents);
  const [agent, setAgent]             = useState<UserStub | null>(booking.agent);
  const [depositSaving, setDepositSaving]       = useState(false);
  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositVal, setDepositVal]             = useState(amountPaid > 0 ? String(amountPaid / 100) : "");

  const dateObj = new Date(booking.date);
  const day     = dateObj.getUTCDate();
  const month   = dateObj.getUTCMonth() + 1;

  const accentColor = STATUS_BORDER[status];
  const waData      = buildWaData(booking);
  const serviceMeta = SERVICE_META[booking.service ?? ""];

  function copyDetails() {
    const phone = booking.phone.replace(/\D/g, "");
    const lines = [
      `Name: ${booking.name}`,
      `Date: ${day}/${month}`,
      booking.time ? `Time: ${booking.time}` : null,
      `Service: ${booking.service ?? "—"}`,
      `People: ${booking.numberOfPeople ?? 1}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email}`,
      `Status: ${STATUS_LABEL[status]}`,
      amountPaid > 0 ? `Paid: ${amountPaid / 100} EGP` : `Paid: 0 EGP`,
      booking.instructor ? `Instructor: ${booking.instructor}` : null,
      `https://www.finskitesurfing.com/bookings?q=${phone}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Booking details copied!");
  }

  async function handleSaveDeposit() {
    const cents = Math.round(parseFloat(depositVal || "0") * 100);
    setDepositSaving(true);
    const result = await updateBookingAmountPaid(booking.id, cents);
    setDepositSaving(false);
    if (result.success) {
      setAmountPaid(cents);
      setDepositDialogOpen(false);
      toast.success("Deposit saved");
    } else {
      toast.error("Failed to save deposit");
    }
  }

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

  async function handleAssignAgent(user: UserStub | null) {
    const prev = agent;
    setAgent(user);
    const result = await assignBookingAgent(booking.id, user?.id ?? null);
    if (!result.success) {
      setAgent(prev);
      toast.error("Failed to assign agent");
    }
  }

  return (
    <>
    <div className="rounded-2xl bg-white overflow-hidden shadow-[0_1px_6px_rgba(26,22,20,0.08)]">
      <div className="flex items-stretch min-h-[76px]">

        {/* ── Status strip ── */}
        <div className="w-[3px] shrink-0" style={{ background: accentColor }} />

        {/* ── Content ── */}
        <div className="flex-1 flex items-center gap-4 px-4 py-3.5 min-w-0">

          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Name row */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-[family-name:var(--font-raleway)] font-[700] text-[0.92rem] text-[#1a1614] leading-snug truncate">
                {booking.name}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[#a09890] shrink-0">
                <Users className="h-3 w-3" />
                <span className="font-[family-name:var(--font-raleway)] text-[0.72rem] font-[500] tabular-nums">
                  {booking.numberOfPeople}
                </span>
              </span>
            </div>

            {/* Meta row: service · time · date */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {serviceMeta && (
                <>
                  <span
                    className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.12em] uppercase font-[700]"
                    style={{ color: serviceMeta.dot }}
                  >
                    {serviceMeta.label}
                  </span>
                  <span className="text-[#d6d0c8] text-[0.6rem]">·</span>
                </>
              )}
              {booking.time && (
                <>
                  <span className="font-[family-name:var(--font-roboto)] text-[0.72rem] text-[#8a8480] tabular-nums">
                    {booking.time}
                  </span>
                  <span className="text-[#d6d0c8] text-[0.6rem]">·</span>
                </>
              )}
              <span className="font-[family-name:var(--font-roboto)] text-[0.72rem] text-[#a09890] tabular-nums">
                {day}/{month}
              </span>
              {booking.instructor && (
                <>
                  <span className="text-[#d6d0c8] text-[0.6rem]">·</span>
                  <span className="font-[family-name:var(--font-raleway)] text-[0.67rem] text-[#8a8480] truncate max-w-[100px]">
                    {booking.instructor}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: status + amount + actions */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">

            {/* Status pill — dropdown trigger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-opacity disabled:opacity-40 hover:opacity-75"
                  style={{ borderColor: `${accentColor}40`, background: `${accentColor}12` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: accentColor }}
                  />
                  <span
                    className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.1em] uppercase font-[700]"
                    style={{ color: accentColor }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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

            {/* Agent chip */}
            {agent && (
              <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] font-[500] text-[#b0a89f] text-right leading-tight truncate max-w-[100px]">
                {agent.name ?? agent.email.split("@")[0]}
              </span>
            )}

            {/* Amount + action buttons row */}
            <div className="flex items-center gap-1.5">
              {/* Amount paid chip */}
              <span
                className="font-[family-name:var(--font-raleway)] text-[0.65rem] font-[600] tabular-nums mr-1"
                style={{ color: amountPaid > 0 ? "#22c55e" : "#c0b8b0" }}
              >
                {amountPaid > 0 ? `${(amountPaid / 100).toLocaleString("en-EG")} EGP` : "Unpaid"}
              </span>

              {/* Phone */}
              <a
                href={`tel:${booking.phone}`}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#eff6ff] text-[#3b82f6] hover:bg-[#dbeafe] active:bg-[#bfdbfe] transition-colors"
                title="Call"
              >
                <Phone className="h-[18px] w-[18px]" />
              </a>

              {/* Combined ⋯ dropdown */}
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f5f2ef] text-[#6b6460] hover:bg-[#ece8e3] active:bg-[#ddd8d2] transition-colors"
                    title="More actions"
                  >
                    <MoreHorizontal className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <a
                      href={waData.plainWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5 text-[#22c55e]" />
                      Open WhatsApp
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                  <DropdownMenuItem onSelect={copyDetails}>
                    Copy booking details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setDepositVal(amountPaid > 0 ? String(amountPaid / 100) : "");
                      setDepositDialogOpen(true);
                    }}
                  >
                    Edit amount paid
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span className="text-[0.72rem]">
                        {agent ? `Agent: ${agent.name ?? agent.email.split("@")[0]}` : "Assign agent"}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-60 overflow-y-auto w-48">
                      {agent && (
                        <>
                          <DropdownMenuItem onSelect={() => handleAssignAgent(null)}>
                            <span className="text-[0.72rem] text-destructive">Remove agent</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {allUsers.map((u) => (
                        <DropdownMenuItem key={u.id} onSelect={() => handleAssignAgent(u)}>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-[0.72rem]">{u.name ?? u.email}</span>
                            {u.name && (
                              <span className="text-[0.6rem] text-muted-foreground">{u.email}</span>
                            )}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Edit booking */}
              <Link
                href={`/bookings/${booking.id}/edit`}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f5f2ef] text-[#6b6460] hover:bg-[#ece8e3] active:bg-[#ddd8d2] transition-colors"
                title="Edit booking"
              >
                <Pencil className="h-[18px] w-[18px]" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* ── Deposit dialog ── */}
    <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xs rounded-2xl bg-white border border-[#ece8e3] shadow-xl p-0"
      >
        <DialogHeader className="border-[#ece8e3] px-6 pt-6 pb-4">
          <DialogTitle className="text-[1.1rem] font-[700] text-[#1a1614] tracking-normal">
            Amount Paid
          </DialogTitle>
          <p className="font-[family-name:var(--font-raleway)] text-[0.8rem] text-[#8a8480] mt-0.5">
            {booking.name}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-1.5">
          <label className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.12em] uppercase font-[600] text-[#8a8480]">
            Amount (EGP)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={depositVal}
            onChange={(e) => setDepositVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveDeposit(); }}
            placeholder="0"
            autoFocus
            className="w-full border border-[#ece8e3] rounded-xl px-3.5 py-2.5 text-[1rem] text-[#1a1614] font-[family-name:var(--font-roboto)] bg-white focus:outline-none focus:border-[#1a1614] transition-colors"
          />
        </div>

        <DialogFooter className="border-[#ece8e3] px-6 pb-6 pt-4 flex-row gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setDepositDialogOpen(false)}
            className="flex-1 border border-[#ece8e3] text-[#8a8480] font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] py-2.5 rounded-xl hover:bg-[#f5f2ef] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDeposit}
            disabled={depositSaving}
            className="flex-1 bg-[#1a1614] text-white font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[700] py-2.5 rounded-xl hover:bg-[#2a2420] transition-colors disabled:opacity-50"
          >
            {depositSaving ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default BookingComponent;
