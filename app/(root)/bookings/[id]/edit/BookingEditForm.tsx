"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import Image from "next/image";
import { UpdateBookingData, updateBookingSchema } from "@/lib/validators";
import { updateBooking, deleteBooking, assignBookingAgent, type BookingWithAgent } from "@/lib/actions/booking.actions";
import kitePhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FieldGroup,
  FieldLabel,
  Field,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function isKitesurfingService(service: string | null | undefined) {
  return service === "kitesurfing-course";
}

type Props = {
  booking: BookingWithAgent;
  instructors: { id: string; name: string | null }[];
  allUsers: { id: string; name: string | null; email: string }[];
};

function BookingEditForm({ booking, instructors, allUsers }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>(booking.agentId ?? "none");
  const [open, setOpen] = React.useState(false);
  const [peopleInput, setPeopleInput] = React.useState(String(booking.numberOfPeople ?? 1));
  const [kidsInput, setKidsInput] = React.useState(String(booking.numberOfKids ?? 0));
  const [amountInput, setAmountInput] = React.useState(String(Math.round((booking.amountPaidCents ?? 0) / 100)));
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: booking.name,
      date: new Date(booking.date),
      email: booking.email,
      phone: booking.phone,
      service: booking.service,
      numberOfPeople: booking.numberOfPeople ?? 1,
      numberOfKids: booking.numberOfKids ?? 0,
      amountPaidCents: booking.amountPaidCents ?? 0,
      instructor: booking.instructor ?? null,
      time: booking.time ?? null,
    } as UpdateBookingData,
    validators: {
      onSubmit: ({ value }) => {
        const result = updateBookingSchema.safeParse(value);
        if (result.success) return;
        return result.error.flatten().fieldErrors as any;
      },
    },
    onSubmit: async ({ value }) => {
      if (!value.date || !value.service) {
        toast.error("Please fill in all required fields");
        return;
      }
      setIsSubmitting(true);
      try {
        const agentId = selectedAgentId === "none" ? null : selectedAgentId;
        const [result] = await Promise.all([
          updateBooking(booking.id, {
            ...value,
            instructor: isKitesurfingService(value.service) ? (value.instructor ?? null) : null,
            time: value.time ?? null,
          }),
          assignBookingAgent(booking.id, agentId),
        ]);
        if (result?.success && result.bookingId && result.date) {
          toast.success("Booking updated");
          router.back();
        } else {
          toast.error(result?.message || "Failed to update booking");
          setIsSubmitting(false);
        }
      } catch (error: any) {
        toast.error(error.message || "Something went wrong. Please try again.");
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="md:flex md:m-2">
      <Image
        src={kitePhoto}
        alt="Kite surfer making a jump"
        className="hidden md:block md:w-1/2 lg:w-2/3 rounded-l-4xl object-cover"
      />
      <Card className="m-2 md:m-0 md:w-1/2 lg:w-1/3 md:rounded-s-none rounded-4xl">
        <CardHeader>
          <CardTitle>Edit Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="update-booking-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                      <Input
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="First and Family name"
                        autoComplete="off"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Email address"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="phone"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                      <PhoneInput
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        aria-invalid={isInvalid}
                        international
                        defaultCountry="EG"
                        disabled={isSubmitting}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="numberOfPeople"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Adults</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        inputMode="numeric"
                        value={peopleInput}
                        onChange={(e) => {
                          setPeopleInput(e.target.value);
                          const n = parseInt(e.target.value, 10);
                          if (!isNaN(n) && n >= 1) field.handleChange(n);
                        }}
                        onBlur={() => {
                          const n = parseInt(peopleInput, 10);
                          const valid = isNaN(n) || n < 1 ? 1 : n;
                          setPeopleInput(String(valid));
                          field.handleChange(valid);
                          field.handleBlur();
                        }}
                        aria-invalid={isInvalid}
                        placeholder="1"
                        min="1"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="numberOfKids"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Kids (ages 5–8)</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        inputMode="numeric"
                        value={kidsInput}
                        onChange={(e) => {
                          setKidsInput(e.target.value);
                          const n = parseInt(e.target.value, 10);
                          if (!isNaN(n) && n >= 0) field.handleChange(n);
                        }}
                        onBlur={() => {
                          const n = parseInt(kidsInput, 10);
                          const valid = isNaN(n) || n < 0 ? 0 : n;
                          setKidsInput(String(valid));
                          field.handleChange(valid);
                          field.handleBlur();
                        }}
                        aria-invalid={isInvalid}
                        placeholder="0"
                        min="0"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="amountPaidCents"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Amount Paid (EGP)</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        inputMode="numeric"
                        value={amountInput}
                        onChange={(e) => {
                          setAmountInput(e.target.value);
                          const n = parseInt(e.target.value, 10);
                          if (!isNaN(n) && n >= 0) field.handleChange(n * 100);
                        }}
                        onBlur={() => {
                          const n = parseInt(amountInput, 10);
                          const valid = isNaN(n) || n < 0 ? 0 : n;
                          setAmountInput(String(valid));
                          field.handleChange(valid * 100);
                          field.handleBlur();
                        }}
                        aria-invalid={isInvalid}
                        placeholder="0"
                        min="0"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="date"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id={field.name}
                            className="justify-start font-normal rounded-full"
                            disabled={isSubmitting}
                          >
                            {field.state.value ? format(field.state.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.state.value}
                            onSelect={(date) => {
                              if (date) {
                                field.handleChange(
                                  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
                                );
                              } else {
                                field.handleChange(date);
                              }
                              setOpen(false);
                            }}
                            defaultMonth={field.state.value}
                            required={true}
                          />
                        </PopoverContent>
                      </Popover>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="service"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Service</FieldLabel>
                      <Select onValueChange={field.handleChange} value={field.state.value}>
                        <SelectTrigger id={field.name} className="w-full rounded-full" disabled={isSubmitting}>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="kitesurfing-course">Kitesurfing course</SelectItem>
                            <SelectItem value="day-use">Day use</SelectItem>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="pharaoh-airstyle">Pharaoh Airstyle</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="time"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Arrival Time</FieldLabel>
                      <Select onValueChange={field.handleChange} value={field.state.value ?? undefined}>
                        <SelectTrigger id={field.name} className="w-full rounded-full" disabled={isSubmitting}>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","14:00","15:00","16:00","17:00"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="instructor"
                children={(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return isKitesurfingService(form.getFieldValue("service")) ? (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Instructor</FieldLabel>
                      <Select onValueChange={field.handleChange} value={field.state.value ?? undefined}>
                        <SelectTrigger id={field.name} className="w-full rounded-full" disabled={isSubmitting}>
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {instructors.map((instructor) => (
                              <SelectItem key={instructor.id} value={instructor.name ?? instructor.id}>
                                {instructor.name ?? "Unnamed"}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  ) : null;
                }}
              />
              <Field>
                <FieldLabel>Agent</FieldLabel>
                <Select
                  value={selectedAgentId}
                  onValueChange={setSelectedAgentId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {allUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={isSubmitting}
            onClick={async () => {
              if (!confirm(`Delete booking for ${booking.name}? This cannot be undone.`)) return;
              setIsSubmitting(true);
              const result = await deleteBooking(booking.id);
              if (result.success) {
                toast.success("Booking deleted");
                router.push("/bookings");
              } else {
                toast.error(result.message ?? "Failed to delete booking");
                setIsSubmitting(false);
              }
            }}
          >
            Delete
          </Button>
          <Field orientation="horizontal" className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Reset
            </Button>
            <Button
              className="rounded-full"
              type="submit"
              form="update-booking-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}

export default BookingEditForm;
