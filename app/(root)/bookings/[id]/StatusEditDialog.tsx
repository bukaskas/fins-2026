"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookingStatus } from "@prisma/client";

import { updateBookingStatus } from "@/lib/actions/booking.actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type ToneStyle = { label: string; bg: string; ring: string; text: string; dot: string };

type Props = {
  bookingId: string;
  status: BookingStatus;
  tones: Record<BookingStatus, ToneStyle>;
};

function StatusPill({ tone }: { tone: ToneStyle }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
      style={{ background: tone.bg, borderColor: tone.ring, color: tone.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone.dot, boxShadow: `0 0 0 3px ${tone.bg}, 0 0 0 4px ${tone.dot}30` }}
      />
      <span className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.2em] uppercase font-[700]">
        {tone.label}
      </span>
    </span>
  );
}

export default function StatusEditDialog({ bookingId, status, tones }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BookingStatus>(status);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setSelected(status);
  }, [open, status]);

  const onSave = async () => {
    if (selected === status) {
      setOpen(false);
      return;
    }
    setIsSubmitting(true);
    const res = await updateBookingStatus(bookingId, selected);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Status updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update status");
    }
  };

  const tone = tones[status];
  const orderedStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.REQUEST_SENT,
    BookingStatus.UNDER_REVIEW,
    BookingStatus.WAITING_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.ARRIVED,
    BookingStatus.DECLINED,
    BookingStatus.NO_RESPONSE_EXPIRED,
    BookingStatus.CANCELED,
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Change status"
          className="rounded-full transition-transform hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d0c8]"
        >
          <StatusPill tone={tone} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="booking-status">Status</FieldLabel>
            <Select
              value={selected}
              onValueChange={(v) => setSelected(v as BookingStatus)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="booking-status" className="w-full rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {orderedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tones[s].label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={onSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
