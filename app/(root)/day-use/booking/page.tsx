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
import { format, startOfToday } from "date-fns";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayUsePhoto from "@/public/images/day_use/beach2.webp";
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
import { getClosedDates } from "@/lib/actions/closedDate.actions";
import Image from "next/image";
import { BookingFormData, bookingFormSchema } from "@/lib/validators";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import {
  calculateDayUsePrice,
  formatEGP,
} from "@/lib/pricing";
import { Checkbox } from "@/components/ui/checkbox";

const RATE_META = {
  standard:   { label: "Standard",   dot: "#3b82f6", bg: "#eff6ff", color: "#1d4ed8" },
  holiday:    { label: "Holiday",    dot: "#f59e0b", bg: "#fffbeb", color: "#b45309" },
  discounted: { label: "Discounted", dot: "#22c55e", bg: "#f0fdf4", color: "#15803d" },
};

function RateDisplay({ date }: { date: Date }) {
  const breakdown = calculateDayUsePrice(date, 1, 1);
  const meta = RATE_META[breakdown.rateType];
  return (
    <div className="mt-3 rounded-xl border border-[#ece8e3] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: meta.bg }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
        <span
          className="font-[family-name:var(--font-raleway)] text-[0.63rem] tracking-[0.16em] uppercase font-[700]"
          style={{ color: meta.color }}
        >
          {meta.label} rate
        </span>
      </div>
      <div className="divide-y divide-[#f5f2ef] bg-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[0.82rem] text-[#6b6460]">Adult</span>
          <span className="font-[family-name:var(--font-raleway)] text-[0.85rem] font-[700] text-[#1a1614] tabular-nums">
            {formatEGP(breakdown.adultUnitCents)}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[0.82rem] text-[#6b6460]">
            Kids{" "}
            <span className="text-[0.72rem] text-[#a09890]">(5–8 yrs)</span>
          </span>
          <span className="font-[family-name:var(--font-raleway)] text-[0.85rem] font-[700] text-[#1a1614] tabular-nums">
            {formatEGP(breakdown.kidsUnitCents)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PriceBreakdown({
  date,
  adults,
  kids,
}: {
  date: Date;
  adults: number;
  kids: number;
}) {
  const breakdown = calculateDayUsePrice(date, adults, kids);
  return (
    <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
      {adults > 0 && (
        <div className="flex justify-between">
          <span>
            Adults ({adults} × {formatEGP(breakdown.adultUnitCents)})
          </span>
          <span className="font-medium">
            {formatEGP(breakdown.adultTotalCents)}
          </span>
        </div>
      )}
      {kids > 0 && (
        <div className="flex justify-between">
          <span>
            Kids ({kids} × {formatEGP(breakdown.kidsUnitCents)})
          </span>
          <span className="font-medium">
            {formatEGP(breakdown.kidsTotalCents)}
          </span>
        </div>
      )}
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatEGP(breakdown.totalCents)}</span>
      </div>
    </div>
  );
}

function DayUseBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [isMixedGroup, setIsMixedGroup] = React.useState(false);
  // Local display strings so users can clear and re-type without the field snapping back
  const [adultsInput, setAdultsInput] = React.useState("1");
  const [kidsInput, setKidsInput] = React.useState("0");
  const [closedDates, setClosedDates] = React.useState<Date[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    getClosedDates().then((r) => {
      if (r.success) setClosedDates(r.data.map((cd) => new Date(cd.date)));
    });
  }, []);

  const form = useForm({
    defaultValues: {
      name: "",
      date: new Date(Date.now() + 86400000),
      email: "",
      phone: "",
      service: "day-use",
      numberOfPeople: 1,
      numberOfKids: 0,
      totalPriceCents: null,
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
      if (!value.date) {
        toast.error("Please select a date");
        return;
      }
      setIsSubmitting(true);
      try {
        const breakdown = calculateDayUsePrice(
          value.date,
          value.numberOfPeople,
          value.numberOfKids ?? 0,
        );
        const normalizedValue: BookingFormData = {
          ...value,
          service: "day-use",
          instructor: null,
          time: value.time ?? null,
          totalPriceCents: breakdown.totalCents,
        };
        const result = await createBooking(normalizedValue);
        if (result.success && result.bookingId && result.date) {
          toast(result.message);
          router.push(
            `/day-use/booking/success?bookingId=${result.bookingId}&date=${result.date.toISOString()}&type=${result.bookingType}`,
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

  // Step progress indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {([1, 2, 3] as const).map((s) => (
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
    <div className="md:flex md:m-2">
      <Image
        src={dayUsePhoto}
        alt="Day use at Fins Sokhna beach"
        className="hidden md:block md:w-1/2 lg:w-2/3 rounded-l-4xl object-cover"
      />
      <Card className="m-2 md:m-0 md:w-1/2 lg:w-1/3 md:rounded-s-none rounded-4xl">
        <CardHeader>
          <CardTitle>Day Use booking</CardTitle>
          <CardDescription>
            {step === 1 && "Select your arrival date"}
            {step === 2 && "How many tickets?"}
            {step === 3 && "Your contact details"}
          </CardDescription>
          <StepIndicator />
        </CardHeader>

        <CardContent>
          <form
            id="day-use-booking-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            {/* ── STEP 1: Date ── */}
            {step === 1 && (
              <FieldGroup>
                <form.Field
                  name="date"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Arrival Date
                        </FieldLabel>
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={field.name}
                              className="justify-start font-normal rounded-full w-full"
                            >
                              {field.state.value
                                ? format(field.state.value, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.state.value}
                              onSelect={(date) => {
                                if (date) {
                                  const normalized = new Date(
                                    Date.UTC(
                                      date.getFullYear(),
                                      date.getMonth(),
                                      date.getDate(),
                                    ),
                                  );
                                  field.handleChange(normalized);
                                } else {
                                  field.handleChange(date);
                                }
                                setCalendarOpen(false);
                              }}
                              defaultMonth={field.state.value}
                              disabled={[{ before: startOfToday() }, ...closedDates]}
                              required={true}
                            />
                          </PopoverContent>
                        </Popover>
                        {field.state.value && (
                          <RateDisplay date={field.state.value} />
                        )}
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            )}

            {/* ── STEP 2: Tickets + Price ── */}
            {step === 2 && (
              <form.Subscribe
                selector={(state) => ({
                  date: state.values.date,
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ date, adults, kids }) => (
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
                            <FieldLabel htmlFor={field.name}>
                              Kids (5 to 8 years old) above 8 count as adult
                            </FieldLabel>
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
                    {date && (adults > 0 || (kids ?? 0) > 0) && (
                      <PriceBreakdown
                        date={date}
                        adults={adults}
                        kids={kids ?? 0}
                      />
                    )}
                    <div className="flex items-start gap-3 pt-1">
                      <Checkbox
                        id="mixed-group"
                        checked={isMixedGroup}
                        onCheckedChange={(v) => setIsMixedGroup(!!v)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="mixed-group"
                        className="text-sm leading-snug cursor-pointer select-none"
                      >
                        Our group is mixed (men &amp; women)
                      </label>
                    </div>
                  </FieldGroup>
                )}
              />
            )}

            {/* ── STEP 3: Contact info + Summary ── */}
            {step === 3 && (
              <form.Subscribe
                selector={(state) => ({
                  date: state.values.date,
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ date, adults, kids }) => (
                  <FieldGroup>
                    {/* Summary */}
                    {date && (
                      <div className="rounded-xl border bg-muted/50 p-3 text-sm space-y-1 mb-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">
                            {format(date, "PPP")}
                          </span>
                        </div>
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
                              calculateDayUsePrice(date, adults, kids ?? 0)
                                .totalCents,
                            )}
                          </span>
                        </div>
                      </div>
                    )}

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
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                if (step === 1) {
                  const selected = form.getFieldValue("date");
                  const isClosed = selected && closedDates.some(
                    (d) => d.toISOString().slice(0, 10) === selected.toISOString().slice(0, 10),
                  );
                  if (isClosed) {
                    toast.error("Sorry, this date is fully booked.");
                    return;
                  }
                }
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
              disabled={step === 2 && !isMixedGroup}
            >
              Next
            </Button>
          ) : (
            <Button
              className="rounded-full"
              type="submit"
              form="day-use-booking-form"
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

export default DayUseBookingForm;
