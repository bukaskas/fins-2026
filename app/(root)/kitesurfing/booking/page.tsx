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
import { format } from "date-fns";
import { Calendar as CalendarIcon, Phone } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createBooking } from "@/lib/actions/booking.actions";

import { BookingFormData, bookingFormSchema } from "@/lib/validators";
import { PhoneInput } from "./phoneInput";

function KitesurfingBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "John Doe",
      date: new Date(Date.now() + 86400000), // Tomorrow
      email: "john.doe@example.com",
      phone: "+201121105926",
      service: "beginner-lesson",
    },
    validators: {
      onSubmit: bookingFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.date || !value.service) {
        toast.error("Please fill in all required fields");
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await createBooking(value as BookingFormData);
        if (result.success) {
          setIsSubmitting(false);
          toast(`${result.message}`);
          if (result.bookingId && result.date) {
            router.push(
              `/kitesurfing/booking/success?bookingId=${result.bookingId}&date=${result.date.toISOString()}`,
            );
          }
        }
      } catch (error: any) {
        setIsSubmitting(false);
        toast(`Error: ${error.message || "Something went wrong"}`);
      }

      toast("You submitted the following values:", {
        description: (
          <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      });
    },
  });
  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Kite surfing experience booking</CardTitle>
        <CardDescription>
          Fill in the info to reserve your spot!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="booking-form"
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
                      placeholder="Max Leiter"
                      autoComplete="off"
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
                      placeholder="max.leiter@example.com"
                      autoComplete="off"
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
                      autoComplete="off"
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
                          className="justify-start font-normal"
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
                        className="w-full"
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" form="booking-form" disabled={isSubmitting}>
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

export default KitesurfingBookingForm;
