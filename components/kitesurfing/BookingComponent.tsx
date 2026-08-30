"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookingContactChannel,
  BookingContactOutcome,
  BookingStatus,
} from "@prisma/client";
import {
  Clock,
  Copy,
  ExternalLink,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Users,
  WalletCards,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { instagramHref } from "@/lib/utils";
import {
  assignBookingAgent,
  logBookingContact,
  type BookingRow,
} from "@/lib/actions/booking.actions";
import {
  buildBookingMessages,
  recommendedBookingMessage,
  telHref,
  whatsappHref,
} from "@/lib/bookings/messages";
import {
  FOCUS_RING,
  MUTED,
  SERVICE_META,
  STATUS_BORDER,
  STATUS_LABEL,
  STATUS_TEXT,
} from "@/lib/bookings/status";
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
import { useAgents } from "@/components/bookings/AgentsProvider";
import BookingStatusDialog from "@/components/bookings/BookingStatusDialog";
import PayDepositDialog from "@/components/bookings/PayDepositDialog";

type UserStub = { id: string; name: string | null; email: string };

const egp = new Intl.NumberFormat("en-EG");

function formatEGP(cents: number): string {
  return `${egp.format(Math.round(cents / 100))} EGP`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection-based fallback.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Shared decision row for every staff booking list. It answers the three desk
 * questions in order: current state, money due, and the next guest message.
 */
function BookingComponent({ booking }: { booking: BookingRow }) {
  const allUsers = useAgents();
  const [status, setStatus] = useState<BookingStatus>(booking.bookingStatus);
  const [amountPaid, setAmountPaid] = useState(booking.amountPaidCents);
  const [agent, setAgent] = useState<UserStub | null>(booking.agent);
  const [isAssigning, setIsAssigning] = useState(false);
  const [payDepositOpen, setPayDepositOpen] = useState(false);
  const [, startContactTransition] = useTransition();

  useEffect(() => {
    setStatus(booking.bookingStatus);
  }, [booking.bookingStatus]);

  useEffect(() => {
    setAmountPaid(booking.amountPaidCents);
  }, [booking.amountPaidCents]);

  useEffect(() => {
    setAgent(booking.agent);
  }, [booking.agent]);

  const date = new Date(booking.date);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const accentColor = STATUS_BORDER[status];
  const statusTextColor = STATUS_TEXT[status];
  const serviceMeta = SERVICE_META[booking.service ?? ""];
  const totalPrice = booking.totalPriceCents;
  const dueCents =
    totalPrice == null ? null : Math.max(totalPrice - amountPaid, 0);
  const balanceLabel =
    dueCents == null
      ? "Price not set"
      : dueCents > 0
        ? `${formatEGP(dueCents)} due`
        : "Paid";
  const balanceColor =
    dueCents == null ? MUTED : dueCents > 0 ? "#b45309" : "#15803d";

  const messageInput = {
    id: booking.id,
    name: booking.name,
    service: booking.service ?? "",
    date,
    time: booking.time,
    bookingStatus: status,
    numberOfPeople: booking.numberOfPeople,
    numberOfKids: booking.numberOfKids ?? 0,
    totalPriceCents: totalPrice,
    amountPaidCents: amountPaid,
    paymentLink: null,
    instagram: booking.instagram,
  };
  const messages = buildBookingMessages(messageInput);
  const primaryMessage = recommendedBookingMessage(messageInput);
  const alternateMessages = primaryMessage
    ? messages.filter((message) => message.id !== primaryMessage.id)
    : messages;

  const recordContact = (channel: BookingContactChannel) => {
    startContactTransition(async () => {
      try {
        const result = await logBookingContact(
          booking.id,
          channel,
          BookingContactOutcome.ATTEMPTED,
        );
        if (!result.success) toast.error(result.message);
      } catch {
        toast.error(
          "The contact opened, but its history could not be recorded.",
        );
      }
    });
  };

  const copyBookingLink = async () => {
    const copied = await copyText(
      `${window.location.origin}/bookings/${booking.id}`,
    );
    if (copied) toast.success("Booking link copied");
    else
      toast.error(
        "Could not copy the link. Open the guest page and copy its address.",
      );
  };

  const copyDetails = async () => {
    const lines = [
      `Name: ${booking.name}`,
      `Date: ${day}/${month}`,
      booking.time ? `Time: ${booking.time}` : null,
      `Service: ${serviceMeta?.label ?? booking.service ?? "—"}`,
      `People: ${booking.numberOfPeople}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email}`,
      `Status: ${STATUS_LABEL[status]}`,
      totalPrice == null ? "Price: not set" : `Balance: ${balanceLabel}`,
      booking.instructor ? `Instructor: ${booking.instructor}` : null,
      `${window.location.origin}/bookings/${booking.id}`,
    ].filter(Boolean);

    const copied = await copyText(lines.join("\n"));
    if (copied) toast.success("Booking details copied");
    else
      toast.error(
        "Could not copy the details. Open the booking and try again.",
      );
  };

  const handleAssignAgent = async (user: UserStub | null) => {
    if (isAssigning) return;
    const previous = agent;
    setAgent(user);
    setIsAssigning(true);
    try {
      const result = await assignBookingAgent(booking.id, user?.id ?? null);
      if (!result.success) {
        setAgent(previous);
        toast.error(result.message || "Could not assign the agent. Try again.");
        return;
      }
      toast.success(
        user ? `Assigned to ${user.name ?? user.email}` : "Agent removed",
      );
    } catch {
      setAgent(previous);
      toast.error(
        "Could not reach the server. The previous agent was restored.",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-[#ece8e3]/80 bg-white shadow-[0_1px_6px_rgba(26,22,20,0.07)]">
        <div className="flex min-h-[88px] items-stretch">
          <div className="w-px shrink-0" style={{ background: accentColor }} />

          <div className="flex min-w-0 flex-1 flex-col gap-3 px-3.5 py-3.5 sm:flex-row sm:items-center sm:gap-5 sm:px-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-[family-name:var(--font-raleway)] text-[0.95rem] font-[700] leading-snug text-[#1a1614]">
                  {booking.name}
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1"
                  style={{ color: MUTED }}
                >
                  <Users className="size-3.5" aria-hidden="true" />
                  <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[500] tabular-nums">
                    {booking.numberOfPeople + (booking.numberOfKids ?? 0)}
                  </span>
                </span>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {serviceMeta && (
                  <>
                    <span
                      className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] uppercase tracking-[0.1em] sm:text-[0.68rem]"
                      style={{ color: serviceMeta.text }}
                    >
                      {serviceMeta.label}
                    </span>
                    <span className="text-[#d6d0c8]" aria-hidden="true">
                      ·
                    </span>
                  </>
                )}
                {booking.time && (
                  <>
                    <span className="font-[family-name:var(--font-roboto)] text-[0.75rem] tabular-nums text-[#6b6460]">
                      {booking.time}
                    </span>
                    <span className="text-[#d6d0c8]" aria-hidden="true">
                      ·
                    </span>
                  </>
                )}
                <span className="font-[family-name:var(--font-roboto)] text-[0.75rem] tabular-nums text-[#6b6460]">
                  {day}/{month}
                </span>
                {booking.instructor && (
                  <>
                    <span className="text-[#d6d0c8]" aria-hidden="true">
                      ·
                    </span>
                    <span className="max-w-32 truncate font-[family-name:var(--font-raleway)] text-[0.75rem] text-[#6b6460]">
                      {booking.instructor}
                    </span>
                  </>
                )}
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[#6b6460]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  <span className="font-[family-name:var(--font-roboto)] text-[0.75rem] tabular-nums sm:text-[0.7rem]">
                    Booked {format(new Date(booking.createdAt), "d MMM, HH:mm")}
                  </span>
                </span>
                {booking.instagram && (
                  <a
                    href={instagramHref(booking.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-w-0 items-center gap-1 rounded-sm text-[#a02c6d] transition-colors hover:text-[#c13584] ${FOCUS_RING}`}
                  >
                    <Instagram className="size-3 shrink-0" aria-hidden="true" />
                    <span className="max-w-36 truncate font-[family-name:var(--font-raleway)] text-[0.75rem] font-[500] sm:text-[0.7rem]">
                      {booking.instagram}
                    </span>
                  </a>
                )}
                {agent && (
                  <span className="max-w-40 truncate font-[family-name:var(--font-raleway)] text-[0.75rem] sm:text-[0.7rem]">
                    Agent · {agent.name ?? agent.email.split("@")[0]}
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
                <BookingStatusDialog
                  bookingId={booking.id}
                  status={status}
                  onChanged={setStatus}
                  trigger={
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                      style={{
                        borderColor: `${accentColor}40`,
                        background: `${accentColor}12`,
                      }}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: accentColor }}
                      />
                      <span
                        className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] uppercase tracking-[0.08em] sm:text-[0.68rem]"
                        style={{ color: statusTextColor }}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </span>
                  }
                />
                <span
                  className="whitespace-nowrap font-[family-name:var(--font-roboto)] text-[0.8rem] font-[600] tabular-nums"
                  style={{ color: balanceColor }}
                >
                  {balanceLabel}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={whatsappHref(booking.phone, primaryMessage?.body)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordContact(BookingContactChannel.WHATSAPP)}
                  aria-label={`${primaryMessage?.label ?? "Open WhatsApp"} for ${booking.name}`}
                  className={`inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] px-4 text-white transition-colors hover:bg-[#2a2522] sm:min-w-44 ${FOCUS_RING}`}
                >
                  <MessageCircle
                    className="size-4 shrink-0"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span className="truncate font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] uppercase tracking-[0.1em]">
                    {primaryMessage?.label ?? "Open WhatsApp"}
                  </span>
                </a>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`More actions for ${booking.name}`}
                      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f5f2ef] text-[#6b6460] transition-colors hover:bg-[#ece8e3] ${FOCUS_RING}`}
                    >
                      <MoreHorizontal
                        className="size-[18px]"
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)] [&_[data-slot=dropdown-menu-item]]:min-h-10 [&_[data-slot=dropdown-menu-item]]:rounded-md [&_[data-slot=dropdown-menu-item]]:font-[family-name:var(--font-raleway)] [&_[data-slot=dropdown-menu-item]]:text-[#1a1614] [&_[data-slot=dropdown-menu-item]]:focus:bg-[#f5f2ef]"
                  >
                    <DropdownMenuItem asChild>
                      <a
                        href={telHref(booking.phone)}
                        onClick={() =>
                          recordContact(BookingContactChannel.CALL)
                        }
                        className="flex items-center gap-2"
                      >
                        <Phone
                          className="size-4 text-[#1d4ed8]"
                          aria-hidden="true"
                        />
                        Call {booking.name}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/bookings/${booking.id}/edit`}>
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit booking
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/bookings/${booking.id}`}>
                        <ExternalLink
                          className="size-4 text-[#0369a1]"
                          aria-hidden="true"
                        />
                        Open guest page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copyBookingLink()}>
                      <Copy className="size-4" aria-hidden="true" />
                      Copy booking link
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <MessageCircle
                          className="size-4 text-[#15803d]"
                          aria-hidden="true"
                        />
                        Other messages
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-72 w-64 overflow-y-auto rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]">
                        {alternateMessages.map((message) => (
                          <DropdownMenuItem key={message.id} asChild>
                            <a
                              href={whatsappHref(booking.phone, message.body)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                recordContact(BookingContactChannel.WHATSAPP)
                              }
                              className="flex flex-col items-start gap-0.5"
                            >
                              <span>{message.label}</span>
                              <span className="text-xs text-[#6b6460]">
                                {message.when}
                              </span>
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        window.setTimeout(() => setPayDepositOpen(true), 0)
                      }
                      className="min-h-11"
                    >
                      <WalletCards
                        className="size-4 text-[#15803d]"
                        aria-hidden="true"
                      />
                      Record payment
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copyDetails()}>
                      <Copy className="size-4" aria-hidden="true" />
                      Copy booking details
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger disabled={isAssigning}>
                        {agent
                          ? `Agent: ${agent.name ?? agent.email.split("@")[0]}`
                          : "Assign agent"}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-60 w-52 overflow-y-auto rounded-xl border-[#ece8e3] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]">
                        {agent && (
                          <>
                            <DropdownMenuItem
                              disabled={isAssigning}
                              onSelect={() => void handleAssignAgent(null)}
                              className="text-destructive"
                            >
                              Remove agent
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {allUsers.map((user) => (
                          <DropdownMenuItem
                            key={user.id}
                            disabled={isAssigning || user.id === agent?.id}
                            onSelect={() => void handleAssignAgent(user)}
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate">
                                {user.name ?? user.email}
                              </span>
                              {user.name && (
                                <span className="truncate text-xs text-[#6b6460]">
                                  {user.email}
                                </span>
                              )}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </article>

      <PayDepositDialog
        bookingId={booking.id}
        totalPriceCents={booking.totalPriceCents}
        amountPaidCents={amountPaid}
        open={payDepositOpen}
        onOpenChange={setPayDepositOpen}
        onPaid={(newPaid) => {
          setAmountPaid(newPaid);
          setStatus(BookingStatus.CONFIRMED);
        }}
      />
    </>
  );
}

export default BookingComponent;
