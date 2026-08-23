"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookingContactChannel,
  BookingContactOutcome,
} from "@prisma/client";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createBookingPaymentLink,
  logBookingContact,
} from "@/lib/actions/booking.actions";

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function telephoneNumber(phone: string): string {
  const digits = phoneDigits(phone);
  return phone.trim().startsWith("+") ? `+${digits}` : digits;
}

function whatsappDigits(phone: string): string {
  const digits = phoneDigits(phone);
  return digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
}

export function ContactActions({
  bookingId,
  guestName,
  phone,
  email,
  paymentLink,
  needsPaymentLink = false,
}: {
  bookingId: string;
  guestName: string;
  phone: string;
  email?: string | null;
  paymentLink?: string | null;
  needsPaymentLink?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatingLink, setCreatingLink] = useState(false);
  const internationalDigits = whatsappDigits(phone);
  const message = paymentLink
    ? `Hello ${guestName}, here is your Fins booking payment link: ${paymentLink}`
    : `Hello ${guestName}, we are contacting you about your upcoming booking at Fins.`;
  const whatsappUrl = `https://wa.me/${internationalDigits}?text=${encodeURIComponent(message)}`;

  const record = (
    channel: BookingContactChannel,
    outcome: BookingContactOutcome,
    announce = false,
  ) => {
    startTransition(async () => {
      try {
        const result = await logBookingContact(bookingId, channel, outcome);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        if (announce) toast.success("Contact recorded");
        router.refresh();
      } catch {
        toast.error("Could not record the contact attempt.");
      }
    });
  };

  const createLink = async () => {
    setCreatingLink(true);
    try {
      const result = await createBookingPaymentLink(bookingId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Payment link ready");
      router.refresh();
    } catch {
      toast.error("Could not create the payment link. Please retry.");
    } finally {
      setCreatingLink(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      toast.success("Payment link copied");
    } catch {
      toast.error("Could not copy the payment link");
    }
  };

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-10 border-[#8898aa]/35 bg-[#E3EBF3] sm:h-9"
      >
        <a
          href={`tel:${telephoneNumber(phone)}`}
          aria-label={`Call ${guestName}`}
          onClick={() =>
            record(
              BookingContactChannel.CALL,
              BookingContactOutcome.ATTEMPTED,
            )
          }
        >
          <Phone /> Call
        </a>
      </Button>
      {email && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-10 border-[#8898aa]/35 bg-[#E3EBF3] sm:h-9"
        >
          <a
            href={`mailto:${email}?subject=${encodeURIComponent("Your upcoming Fins booking")}`}
            aria-label={`Email ${guestName}`}
            onClick={() =>
              record(
                BookingContactChannel.EMAIL,
                BookingContactOutcome.ATTEMPTED,
              )
            }
          >
            <Mail /> Email
          </a>
        </Button>
      )}
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-10 border-[#8898aa]/35 bg-[#E3EBF3] sm:h-9"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Message ${guestName} on WhatsApp`}
          onClick={() =>
            record(
              BookingContactChannel.WHATSAPP,
              BookingContactOutcome.ATTEMPTED,
            )
          }
        >
          <MessageCircle /> WhatsApp
        </a>
      </Button>
      {paymentLink && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyPaymentLink}
          className="h-10 border-[#8898aa]/35 bg-[#E3EBF3] sm:h-9"
        >
          <Copy /> Copy link
        </Button>
      )}
      {needsPaymentLink && !paymentLink && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={createLink}
          disabled={creatingLink}
          className="h-10 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 sm:h-9"
        >
          {creatingLink ? <Loader2 className="animate-spin" /> : <Link2 />}
          Create link
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          record(
            BookingContactChannel.OTHER,
            BookingContactOutcome.REACHED,
            true,
          )
        }
        className="col-span-2 h-10 sm:h-9"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        Mark contacted
      </Button>
    </div>
  );
}
