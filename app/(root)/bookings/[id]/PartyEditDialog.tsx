"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateBookingParty } from "@/lib/actions/booking.actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type Props = {
  bookingId: string;
  adults: number;
  kids: number;
};

function PartyDisplay({ adults, kids }: { adults: number; kids: number }) {
  const totalPeople = adults + kids;
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-raleway)] text-[3.5rem] font-[100] leading-none tracking-[-0.03em] text-[#1a1614]">
          {totalPeople}
        </span>
        <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#8a8480]">
          {totalPeople === 1 ? "person" : "people"}
        </span>
      </div>
      <div className="mt-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#5b5650] font-[400]">
        {adults} {adults === 1 ? "adult" : "adults"}
        {kids > 0 && (
          <>
            <span className="mx-1.5 text-[#d6d0c8]">·</span>
            {kids} {kids === 1 ? "kid" : "kids"}
          </>
        )}
      </div>
    </>
  );
}

export default function PartyEditDialog({ bookingId, adults, kids }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [adultsInput, setAdultsInput] = React.useState(String(adults));
  const [kidsInput, setKidsInput] = React.useState(String(kids));
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAdultsInput(String(adults));
      setKidsInput(String(kids));
    }
  }, [open, adults, kids]);

  const onSave = async () => {
    const a = parseInt(adultsInput, 10);
    const k = parseInt(kidsInput, 10);
    if (isNaN(a) || a < 1) {
      toast.error("Adults must be at least 1");
      return;
    }
    if (isNaN(k) || k < 0) {
      toast.error("Kids must be 0 or more");
      return;
    }
    setIsSubmitting(true);
    const res = await updateBookingParty(bookingId, a, k);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Party updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update party");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Edit party"
          className="block w-full text-left rounded-lg -m-2 p-2 transition-colors hover:bg-[#f3efe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d0c8]"
        >
          <PartyDisplay adults={adults} kids={kids} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit party</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="party-adults">Adults</FieldLabel>
            <Input
              id="party-adults"
              type="number"
              inputMode="numeric"
              min="1"
              value={adultsInput}
              onChange={(e) => setAdultsInput(e.target.value)}
              disabled={isSubmitting}
              className="rounded-full"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="party-kids">Kids (ages 5–8)</FieldLabel>
            <Input
              id="party-kids"
              type="number"
              inputMode="numeric"
              min="0"
              value={kidsInput}
              onChange={(e) => setKidsInput(e.target.value)}
              disabled={isSubmitting}
              className="rounded-full"
            />
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
