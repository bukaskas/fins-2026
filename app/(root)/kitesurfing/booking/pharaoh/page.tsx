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
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createBooking } from "@/lib/actions/booking.actions";
import { BookingFormData, bookingFormSchema } from "@/lib/validators";
import { PhoneInput } from "../phoneInput";
import { formatEGP } from "@/lib/pricing";

const PHARAOH_DATE = new Date("2026-12-31"); // TBC — postponed due to weather
const PHARAOH_ADULT_PRICE_CENTS = 120000; // 1,200 EGP
const PHARAOH_KIDS_PRICE_CENTS = 60000;   // 600 EGP

const EVENT_HIGHLIGHTS = [
  "🪁 Kite Show",
  "🎵 Music",
  "🧘 Yoga Activities",
  "🎈 Kids Activities",
];

function PostponedBanner() {
  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start">
      <span className="text-amber-500 text-lg mt-0.5">☁️</span>
      <div>
        <p className="text-sm font-semibold text-amber-800">Event Postponed</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Due to unfavourable weather conditions, the Pharaoh Airstyle event has been
          postponed. A new date will be announced soon.
        </p>
      </div>
    </div>
  );
}

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

  return (
    <div className="flex justify-center m-2">
      <Card className="w-full max-w-lg rounded-4xl overflow-hidden pt-0">

        {/* ── Pharaoh Header ───────────────────────────────────── */}
        <div className="relative bg-[#0A1628] px-8 pt-10 pb-8 overflow-hidden">
          {/* depth circles */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#1E3A5F] opacity-30 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#0D1F3C] opacity-50 pointer-events-none" />

          {/* label row */}
          <div className="relative flex items-center gap-3 mb-7">
            <div className="w-5 h-px bg-[#7ECEC4] opacity-70" />
            <p
              className="text-[10px] tracking-[0.28em] uppercase text-[#7ECEC4] opacity-80"
              style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 300 }}
            >
              Kite Beach · Event Registration
            </p>
          </div>

          {/* title */}
          <div className="relative mb-7">
            <h1
              className="text-[52px] leading-[0.88] text-white"
              style={{
                fontFamily: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
                fontWeight: 300,
                letterSpacing: "-0.02em",
              }}
            >
              Pharaoh
            </h1>
            <h1
              className="text-[52px] leading-[0.88] text-[#B8CDD8]"
              style={{
                fontFamily: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
                fontWeight: 300,
                fontStyle: "italic",
                letterSpacing: "-0.02em",
              }}
            >
              Airstyle
            </h1>
          </div>

          {/* sea-foam divider */}
          <div className="relative w-10 h-px bg-[#7ECEC4] opacity-50 mb-4" />

          {/* step context */}
          <p
            className="relative text-[13px] text-[#8FA3BC]"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 300 }}
          >
            {step === 1 ? "Select your tickets" : "Enter your details"}
          </p>

          {/* step pill track */}
          <div className="relative flex items-center gap-1.5 mt-5">
            {([1, 2] as const).map((s) => (
              <div
                key={s}
                className={`h-0.75 rounded-full transition-all duration-500 ${
                  s <= step ? "bg-[#7ECEC4] w-8" : "bg-[#1E3A5F] w-2"
                }`}
              />
            ))}
          </div>
        </div>
        {/* ─────────────────────────────────────────────────────── */}

        <PostponedBanner />

        {/* event chips */}
        <div className="flex flex-wrap gap-2 px-6 pt-4">
          {EVENT_HIGHLIGHTS.map((h) => (
            <span
              key={h}
              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {h}
            </span>
          ))}
        </div>

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
