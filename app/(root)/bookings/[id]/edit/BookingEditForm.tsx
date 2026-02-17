"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import Image from "next/image";
import { BookingFormData, bookingFormSchema } from "@/lib/validators";
import { updateBooking } from "@/lib/actions/booking.actions";
import kitePhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import {
  Card,
  CardContent,
  CardDescription,
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

type Props = {
  booking: Booking;
};

function BookingEditForm({ booking }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: booking.name,
      date: new Date(booking.date),
      email: booking.email,
      phone: booking.phone,
      service: booking.service,
      instructor: booking.instructor,
      time: booking.time,
    } as BookingFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = bookingFormSchema.safeParse(value);
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
        const normalizedValue = {
          ...value,
          instructor: value.instructor ?? null,
          time: value.time ?? null,
        };
        console.log("Submitting form with values:", normalizedValue);
        const result = await updateBooking(
          booking.id,
          normalizedValue as BookingFormData,
        );
        if (result?.success && result.bookingId && result.date) {
          toast(result.message);
          router.push(`/bookings`);
        } else {
          toast(result?.message || "Failed to update booking");
          setIsSubmitting(false);
        }
      } catch (error: any) {
        toast(error.message || "Something went wrong. Please try again.");
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
          <CardTitle>Kite surfing experience booking</CardTitle>
          <CardDescription>
            Fill in the info to reserve your spot!
          </CardDescription>
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
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Email address"
                        disabled={isSubmitting}
                        className="rounded-full"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="phone"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="date"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Arrival Date</FieldLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id={field.name}
                            className="justify-start font-normal rounded-full"
                            disabled={isSubmitting}
                          >
                            {field.state.value ? (
                              format(field.state.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.state.value}
                            onSelect={(date) => {
                              field.handleChange(date);
                              setOpen(false);
                            }}
                            defaultMonth={field.state.value}
                            disabled={{ before: new Date() }}
                            required={true}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                  );
                }}
              />
              <form.Field
                name="service"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Service</FieldLabel>
                      <Select
                        onValueChange={field.handleChange}
                        value={field.state.value}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full rounded-full"
                          disabled={isSubmitting}
                        >
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="private-course">
                              Private Course
                            </SelectItem>
                            <SelectItem value="group-course">
                              Group Course
                            </SelectItem>
                            <SelectItem value="coaching">Coaching</SelectItem>
                            <SelectItem value="equipment-rental">
                              Equipment Rental
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="time"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Service</FieldLabel>
                      <Select
                        onValueChange={field.handleChange}
                        value={field.state.value ?? undefined}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full rounded-full"
                          disabled={isSubmitting}
                        >
                          <SelectValue placeholder="Select time of the session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="09:00">09:00</SelectItem>
                            <SelectItem value="09:30">09:30</SelectItem>
                            <SelectItem value="10:00">10:00</SelectItem>
                            <SelectItem value="10:30">10:30</SelectItem>
                            <SelectItem value="11:00">11:00</SelectItem>
                            <SelectItem value="11:30">11:30</SelectItem>
                            <SelectItem value="12:00">12:00</SelectItem>
                            <SelectItem value="12:30">12:30</SelectItem>
                            <SelectItem value="13:00">13:00</SelectItem>
                            <SelectItem value="14:00">14:00</SelectItem>
                            <SelectItem value="15:00">15:00</SelectItem>
                            <SelectItem value="16:00">16:00</SelectItem>
                            <SelectItem value="17:00">17:00</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="instructor"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Service</FieldLabel>
                      <Select
                        onValueChange={field.handleChange}
                        value={field.state.value ?? undefined}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full rounded-full"
                          disabled={isSubmitting}
                        >
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="Mohie">Mohie</SelectItem>
                            <SelectItem value="Tarek">Tarek</SelectItem>
                            <SelectItem value="Ahmed Sawa7ly">
                              Ahmed Sawa7ly
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
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
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}

export default BookingEditForm;
