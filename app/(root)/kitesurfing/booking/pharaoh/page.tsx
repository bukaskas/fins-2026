"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import airstylePhoto from "@/public/images/kitesurfing/airstyle-form.webp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createBooking } from "@/lib/actions/booking.actions";
import Image from "next/image";
import { BookingFormData, bookingFormSchema } from "@/lib/validators";
import { PhoneInput } from "../phoneInput";

const PHARAOH_DATE = new Date(2026, 5, 1); // May 1st, 2026

function PharaohAirstyleBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      date: PHARAOH_DATE,
      email: "",
      phone: "",
      service: "pharaoh-airstyle",
      numberOfPeople: 1,
      time: null,
    } as BookingFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = bookingFormSchema.safeParse(value);
        if (result.success) return;

        const fieldErrors = result.error.flatten().fieldErrors;
        return fieldErrors as any;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const normalizedValue = {
          ...value,
          instructor: null,
          time: value.time ?? null,
        };
        const result = await createBooking(normalizedValue as BookingFormData);
        if (result.success && result.bookingId && result.date) {
          toast(`${result.message}`);
          router.push(
            `/kitesurfing/booking/success?bookingId=${result.bookingId}&date=${result.date.toISOString()}&type=${result.bookingType}`,
          );
        } else {
          toast(result.message || "Failed to create booking");
          setIsSubmitting(false);
        }
      } catch (error: any) {
        toast(error.message || "Something went wrong. Please try again.");
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="flex justify-center m-2">
      <Card className="w-full max-w-lg rounded-4xl overflow-hidden pt-0">
        <div className="relative w-full h-150">
          <Image src={airstylePhoto} alt="Pharaoh Airstyle Competition" fill />
        </div>
        <CardHeader>
          <CardTitle>Pharaoh Airstyle — 1st of May</CardTitle>
          <CardDescription>
            Fill in the info to reserve your spot!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="pharaoh-booking-form"
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
                name="numberOfPeople"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Number of People
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        inputMode="numeric"
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        aria-invalid={isInvalid}
                        placeholder="1"
                        min="1"
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
                name="time"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Arrival Time</FieldLabel>
                      <Select
                        onValueChange={field.handleChange}
                        value={field.state.value ?? undefined}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full rounded-full"
                          disabled={isSubmitting}
                        >
                          <SelectValue placeholder="Select a time" />
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
              form="pharaoh-booking-form"
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

export default PharaohAirstyleBookingForm;
