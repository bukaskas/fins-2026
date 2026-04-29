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
import { formatEGP } from "@/lib/pricing";

const PHARAOH_DATE = new Date("2026-05-15");
const PHARAOH_ADULT_PRICE_CENTS = 120000; // 1,200 EGP
const PHARAOH_KIDS_PRICE_CENTS = 60000;   // 600 EGP

const EVENT_HIGHLIGHTS = [
  "🪁 Kite Show",
  "🎵 Music",
  "🧘 Yoga Activities",
  "🎈 Kids Activities",
];

function PriceBreakdown({ adults, kids }: { adults: number; kids: number }) {
  const adultTotal = adults * PHARAOH_ADULT_PRICE_CENTS;
  const kidsTotal = kids * PHARAOH_KIDS_PRICE_CENTS;
  const total = adultTotal + kidsTotal;

  return (
    <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
      {adults > 0 && (
        <div className="flex justify-between">
          <span>
            Adults ({adults} × {formatEGP(PHARAOH_ADULT_PRICE_CENTS)})
          </span>
          <span className="font-medium">{formatEGP(adultTotal)}</span>
        </div>
      )}
      {kids > 0 && (
        <div className="flex justify-between">
          <span>
            Kids ({kids} × {formatEGP(PHARAOH_KIDS_PRICE_CENTS)})
          </span>
          <span className="font-medium">{formatEGP(kidsTotal)}</span>
        </div>
      )}
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatEGP(total)}</span>
      </div>
    </div>
  );
}

function PharaohAirstyleBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [adultsInput, setAdultsInput] = React.useState("1");
  const [kidsInput, setKidsInput] = React.useState("0");
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      date: PHARAOH_DATE,
      email: "",
      phone: "",
      service: "pharaoh-airstyle",
      numberOfPeople: 1,
      numberOfKids: 0,
      totalPriceCents: PHARAOH_ADULT_PRICE_CENTS,
      time: null,
      instructor: null,
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
        const totalPriceCents =
          value.numberOfPeople * PHARAOH_ADULT_PRICE_CENTS +
          (value.numberOfKids ?? 0) * PHARAOH_KIDS_PRICE_CENTS;
        const normalizedValue: BookingFormData = {
          ...value,
          instructor: null,
          time: null,
          totalPriceCents,
        };
        const result = await createBooking(normalizedValue);
        if (result.success && result.bookingId && result.date) {
          toast(result.message);
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

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {([1, 2] as const).map((s) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full transition-colors ${
            s <= step ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex justify-center m-2">
      <Card className="w-full max-w-lg rounded-4xl overflow-hidden pt-0">
        <div className="relative w-full h-150">
          <Image src={airstylePhoto} alt="Pharaoh Airstyle Competition" fill />
        </div>
        <CardHeader>
          <CardTitle>Pharaoh Airstyle — 15th of May</CardTitle>
          <CardDescription>
            {step === 1 ? "Select your tickets" : "Your contact details"}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            {EVENT_HIGHLIGHTS.map((h) => (
              <span
                key={h}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {h}
              </span>
            ))}
          </div>
          <StepIndicator />
        </CardHeader>

        <CardContent>
          <form
            id="pharaoh-booking-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            {/* Step 1: Ticket selection */}
            {step === 1 && (
              <form.Subscribe
                selector={(state) => ({
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ adults, kids }) => (
                  <FieldGroup>
                    <form.Field
                      name="numberOfPeople"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Adults</FieldLabel>
                            <Input
                              id={field.name}
                              type="number"
                              inputMode="numeric"
                              value={adultsInput}
                              onChange={(e) => {
                                setAdultsInput(e.target.value);
                                const n = parseInt(e.target.value, 10);
                                if (!isNaN(n) && n >= 1) field.handleChange(n);
                              }}
                              onBlur={() => {
                                const n = parseInt(adultsInput, 10);
                                const valid = isNaN(n) || n < 1 ? 1 : n;
                                setAdultsInput(String(valid));
                                field.handleChange(valid);
                                field.handleBlur();
                              }}
                              aria-invalid={isInvalid}
                              placeholder="1"
                              min="1"
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
                      name="numberOfKids"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Kids</FieldLabel>
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
                              className="rounded-full"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                    {(adults > 0 || (kids ?? 0) > 0) && (
                      <PriceBreakdown adults={adults} kids={kids ?? 0} />
                    )}
                  </FieldGroup>
                )}
              />
            )}

            {/* Step 2: Contact info */}
            {step === 2 && (
              <form.Subscribe
                selector={(state) => ({
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ adults, kids }) => (
                  <FieldGroup>
                    <div className="rounded-xl border bg-muted/50 p-3 text-sm space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adults</span>
                        <span>{adults}</span>
                      </div>
                      {(kids ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kids</span>
                          <span>{kids}</span>
                        </div>
                      )}
                      <div className="border-t pt-1 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>
                          {formatEGP(
                            adults * PHARAOH_ADULT_PRICE_CENTS +
                              (kids ?? 0) * PHARAOH_KIDS_PRICE_CENTS,
                          )}
                        </span>
                      </div>
                    </div>

                    <form.Field
                      name="name"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              Full Name
                            </FieldLabel>
                            <Input
                              id={field.name}
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
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
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                            <Input
                              id={field.name}
                              type="email"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
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
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
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
                  </FieldGroup>
                )}
              />
            )}
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          ) : (
            <Button
              className="rounded-full"
              type="submit"
              form="pharaoh-booking-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default PharaohAirstyleBookingForm;
