"use client";
import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayUsePhoto from "@/public/images/day_use/beach2.webp";
import { toast } from "sonner";
import { createBooking } from "@/lib/actions/booking.actions";
import { getClosedDates } from "@/lib/actions/closedDate.actions";
import Image from "next/image";
import {
  BookingFormData,
  bookingFormSchema,
  toFieldErrors,
} from "@/lib/validators";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import { calculateDayUsePrice, formatEGP } from "@/lib/pricing";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, CalendarDays, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// Instagram is optional in the shared schema (other forms, e.g. Pharaoh
// event booking, don't collect it) but required for day-use bookings.
const dayUseBookingFormSchema = bookingFormSchema.extend({
  instagram: z.string().trim().min(1, "Instagram account is required"),
});

/* ─────────────────────────────────────────────────────────────
   Visual world — carried across from /day-use so the button you
   land on matches the button you clicked. Recorded in
   .claude/design-system/pages/day-use.md
   ───────────────────────────────────────────────────────────── */
const NAVY = "#0c1a2e";
const SKY = "#38bdf8";
const MUTED = "#54657a"; // navy-tinted slate, 5.3:1 on white
const HAIRLINE = "#dbe3ec";
const TINT = "#f4f8fb";

const WHATSAPP_HREF = "https://wa.me/201222144388";

// Saturated hue drives the dot and the tint; the label always uses the
// darkened pair so it clears 4.5:1. Standard uses the brand sky rather than a
// generic blue — the rate is a Fins idea, not a status badge.
const RATE_META = {
  standard: { label: "Standard", dot: "#0284c7", bg: "#f0f9ff", color: "#0369a1" },
  holiday: { label: "Holiday", dot: "#f59e0b", bg: "#fffbeb", color: "#b45309" },
  discounted: { label: "Discounted", dot: "#22c55e", bg: "#f0fdf4", color: "#15803d" },
};

const STEP_TITLES = {
  1: "When are you coming?",
  2: "Who's coming?",
  3: "Where do we reach you?",
} as const;

/** Calendar selections are normalised to UTC midnight; the default has to use
 *  the same shape or a late-night booker sees one date and stores another. */
function utcTomorrow() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  );
}

function utcStartOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const eyebrow =
  "font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.2em] uppercase font-[700]";

/* ── Rate panel shown the moment a date is picked ── */
function RateDisplay({ date }: { date: Date }) {
  const breakdown = calculateDayUsePrice(date, 1, 1);
  const meta = RATE_META[breakdown.rateType];
  return (
    <div
      className="mt-4 rounded-2xl overflow-hidden border"
      style={{ borderColor: HAIRLINE }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: meta.bg }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: meta.dot }}
        />
        <span className={eyebrow} style={{ color: meta.color }}>
          {meta.label} rate
        </span>
      </div>
      <div className="bg-white divide-y" style={{ borderColor: HAIRLINE }}>
        {[
          { label: "Adult", sub: null, cents: breakdown.adultUnitCents },
          { label: "Child", sub: "5–8 years", cents: breakdown.kidsUnitCents },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderColor: HAIRLINE }}
          >
            <span className="text-[0.875rem]" style={{ color: MUTED }}>
              {row.label}
              {row.sub && (
                <span className="text-[0.8125rem]" style={{ color: MUTED }}>
                  {" "}
                  · {row.sub}
                </span>
              )}
            </span>
            <span
              className="font-[family-name:var(--font-raleway)] text-[0.9375rem] font-[700] tabular-nums"
              style={{ color: NAVY }}
            >
              {formatEGP(row.cents)}
            </span>
          </div>
        ))}
      </div>
      <p
        className="px-4 py-2.5 text-[0.8125rem] bg-white border-t"
        style={{ color: MUTED, borderColor: HAIRLINE }}
      >
        Children under 5 join free — no ticket needed.
      </p>
    </div>
  );
}

/* ── Live price arithmetic on step 2 ── */
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
  const meta = RATE_META[breakdown.rateType];
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: HAIRLINE, background: TINT }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: meta.dot }}
        />
        <span className={eyebrow} style={{ color: meta.color }}>
          {meta.label} rate · {format(date, "d MMM")}
        </span>
      </div>
      <div className="space-y-2.5">
        {adults > 0 && (
          <div className="flex justify-between text-[0.875rem]">
            <span style={{ color: MUTED }}>
              {adults} × adult {formatEGP(breakdown.adultUnitCents)}
            </span>
            <span className="tabular-nums font-[600]" style={{ color: NAVY }}>
              {formatEGP(breakdown.adultTotalCents)}
            </span>
          </div>
        )}
        {kids > 0 && (
          <div className="flex justify-between text-[0.875rem]">
            <span style={{ color: MUTED }}>
              {kids} × child {formatEGP(breakdown.kidsUnitCents)}
            </span>
            <span className="tabular-nums font-[600]" style={{ color: NAVY }}>
              {formatEGP(breakdown.kidsTotalCents)}
            </span>
          </div>
        )}
      </div>
      <div
        className="mt-4 pt-4 border-t flex items-baseline justify-between"
        style={{ borderColor: HAIRLINE }}
      >
        <span className={eyebrow} style={{ color: MUTED }}>
          Total
        </span>
        <span
          className="font-[family-name:var(--font-raleway)] text-[1.75rem] font-[300] tracking-[-0.02em] tabular-nums"
          style={{ color: NAVY }}
        >
          {formatEGP(breakdown.totalCents)}
        </span>
      </div>
    </div>
  );
}

/* ── Guest counter: 44px targets, typeable, clamped ── */
function CountStepper({
  id,
  label,
  hint,
  value,
  display,
  onDisplayChange,
  onCommit,
  min,
  max,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  display: string;
  onDisplayChange: (next: string) => void;
  onCommit: (next: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const step = (delta: number) => {
    const next = clamp((Number.isNaN(value) ? min : value) + delta);
    onDisplayChange(String(next));
    onCommit(next);
  };

  const btn =
    "size-11 shrink-0 rounded-full border flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-[0.9375rem] font-[600]"
          style={{ color: NAVY }}
        >
          {label}
        </label>
        {hint && (
          <p className="text-[0.8125rem] mt-0.5" style={{ color: MUTED }}>
            {hint}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          className={btn}
          style={{ borderColor: HAIRLINE, color: NAVY }}
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label={`One fewer ${label.toLowerCase()}`}
        >
          <Minus className="size-4" strokeWidth={2.5} />
        </button>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          disabled={disabled}
          onChange={(e) => {
            onDisplayChange(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n) && n >= min && n <= max) onCommit(n);
          }}
          onBlur={() => {
            const n = parseInt(display, 10);
            const next = Number.isNaN(n) ? min : clamp(n);
            onDisplayChange(String(next));
            onCommit(next);
          }}
          className="w-14 h-11 text-center text-[1rem] font-[700] tabular-nums rounded-full"
          style={{ borderColor: HAIRLINE, color: NAVY }}
        />
        <button
          type="button"
          className={btn}
          style={{ borderColor: HAIRLINE, color: NAVY }}
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label={`One more ${label.toLowerCase()}`}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function DayUseBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [policyAccepted, setPolicyAccepted] = React.useState(false);
  const [policyPrompted, setPolicyPrompted] = React.useState(false);
  // Local display strings so users can clear and re-type without the field
  // snapping back mid-keystroke.
  const [adultsInput, setAdultsInput] = React.useState("1");
  const [kidsInput, setKidsInput] = React.useState("0");
  const [closedDates, setClosedDates] = React.useState<Date[]>([]);
  const [closedDatesFailed, setClosedDatesFailed] = React.useState(false);
  const [closedDatesLoading, setClosedDatesLoading] = React.useState(true);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const didMount = React.useRef(false);
  const router = useRouter();

  const loadClosedDates = React.useCallback(() => {
    setClosedDatesLoading(true);
    getClosedDates()
      .then((r) => {
        if (r.success) {
          setClosedDates(r.data.map((cd) => new Date(cd.date)));
          setClosedDatesFailed(false);
        } else {
          setClosedDatesFailed(true);
        }
      })
      .catch(() => setClosedDatesFailed(true))
      .finally(() => setClosedDatesLoading(false));
  }, []);

  React.useEffect(loadClosedDates, [loadClosedDates]);

  // Move focus to the new step heading so the change is announced and keyboard
  // users land in the right place instead of staying on the old button.
  React.useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const form = useForm({
    defaultValues: {
      name: "",
      date: utcTomorrow(),
      email: "",
      phone: "",
      service: "day-use",
      numberOfPeople: 1,
      numberOfKids: 0,
      totalPriceCents: null,
      time: null,
      instructor: null,
      instagram: "",
    } as BookingFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = dayUseBookingFormSchema.safeParse(value);
        if (result.success) return;
        return toFieldErrors(result.error);
      },
    },
    onSubmitInvalid: () => {
      setSubmitError(
        "Some details still need fixing. Check the highlighted fields below.",
      );
    },
    onSubmit: async ({ value }) => {
      if (!value.date) {
        setSubmitError("Please pick your arrival date.");
        return;
      }
      setSubmitError(null);
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
          instagram: value.instagram?.trim() || null,
        };
        const result = await createBooking(normalizedValue);
        if (result.success && result.bookingId) {
          toast.success(result.message);
          router.push(`/bookings/${result.bookingId}`);
        } else {
          const message = result.message || "We couldn't create that booking.";
          setSubmitError(message);
          toast.error(message);
          setIsSubmitting(false);
        }
      } catch (error: any) {
        const message =
          error?.message || "Something went wrong. Please try again.";
        setSubmitError(message);
        toast.error(message);
        setIsSubmitting(false);
      }
    },
  });

  const goToStep = (next: 1 | 2 | 3) => {
    setSubmitError(null);
    setStep(next);
  };

  const handleNext = () => {
    if (step === 1) {
      const selected = form.getFieldValue("date");
      const isClosed =
        selected &&
        closedDates.some(
          (d) =>
            d.toISOString().slice(0, 10) === selected.toISOString().slice(0, 10),
        );
      if (isClosed) {
        setSubmitError("We're fully booked that day. Please pick another date.");
        return;
      }
      goToStep(2);
      return;
    }
    if (step === 2) {
      if (!policyAccepted) {
        // Never a silent dead button: say what's blocking and offer a way out.
        setPolicyPrompted(true);
        return;
      }
      goToStep(3);
    }
  };

  const focusRing = {
    "--tw-ring-color": SKY,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen md:flex" style={{ background: TINT }}>
      {/* ── Brand rail: a banner on mobile, a pinned column on desktop.
             Sticky so the headline and the beach stay in view however long the
             form column gets — otherwise both sit below the fold. ── */}
      <div className="relative md:w-1/2 lg:w-[55%] h-52 sm:h-64 md:h-[calc(100vh-110px)] md:self-start md:sticky md:top-[110px] overflow-hidden">
        <Image
          src={dayUsePhoto}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
          // Bias the crop below the horizon on viewports wide enough to leave
          // vertical slack; the top of this frame is empty sky.
          className="object-cover object-[center_72%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${NAVY}f2 0%, ${NAVY}99 45%, ${NAVY}40 100%)`,
          }}
        />
        {/* Bottom-anchored on the mobile banner; centred on desktop, where the
            fixed site header eats the top of a 100vh column. */}
        <div className="relative h-full flex flex-col justify-end md:justify-center p-6 sm:p-8 md:p-12 lg:p-16">
          <span
            className={cn(eyebrow, "mb-3 sm:mb-4")}
            style={{ color: SKY }}
          >
            Fins Beach Club · Sokhna
          </span>
          <p className="font-[family-name:var(--font-raleway)] text-white leading-[0.95] mb-4 sm:mb-6">
            <span className="block text-[clamp(2rem,6vw,4rem)] font-[100] tracking-[-0.02em]">
              Reserve
            </span>
            <span className="block text-[clamp(2rem,6vw,4rem)] font-[800] tracking-[-0.02em]">
              your day
            </span>
          </p>
          <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2">
            {[
              "Dedicated sunbed & umbrella",
              "9:00 AM – 11:00 PM",
              "500m of shoreline",
            ].map((item) => (
              <span
                key={item}
                className="text-white/75 text-[0.8125rem] font-[300]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form column ── */}
      <div className="md:w-1/2 lg:w-[45%] flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-8 md:py-12 pb-28 md:pb-12">
        <div className="w-full max-w-md mx-auto">
          {/* Progress */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <span className={eyebrow} style={{ color: MUTED }}>
                Step {step} of 3
              </span>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
                  disabled={isSubmitting}
                  className="text-[0.8125rem] underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
                  style={{ color: MUTED, ...focusRing }}
                >
                  Back
                </button>
              )}
            </div>
            <div
              className="flex gap-1.5"
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`Booking progress: step ${step} of 3`}
            >
              {([1, 2, 3] as const).map((s) => (
                <span
                  key={s}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{ background: s <= step ? SKY : HAIRLINE }}
                />
              ))}
            </div>
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-[family-name:var(--font-raleway)] text-[1.5rem] font-[600] tracking-[-0.01em] mb-6 outline-none"
            style={{ color: NAVY }}
          >
            {STEP_TITLES[step]}
          </h1>

          {/* Anything that changed the page state gets announced here. */}
          <div aria-live="polite" className="sr-only">
            {`Step ${step} of 3. ${STEP_TITLES[step]}`}
          </div>

          {submitError && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border px-4 py-3 text-[0.875rem]"
              style={{
                borderColor: "#fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
              }}
            >
              {submitError}
            </div>
          )}

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
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-[0.9375rem] font-[600]"
                          style={{ color: NAVY }}
                        >
                          Arrival date
                        </FieldLabel>
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={field.name}
                              className="justify-start font-normal rounded-full w-full min-h-11 text-[0.9375rem]"
                              style={{ borderColor: HAIRLINE, color: NAVY }}
                            >
                              <CalendarDays
                                className="size-4 mr-1 opacity-60"
                                aria-hidden="true"
                              />
                              {field.state.value
                                ? format(field.state.value, "EEEE d MMMM yyyy")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.state.value}
                              onSelect={(date) => {
                                if (date) {
                                  field.handleChange(
                                    new Date(
                                      Date.UTC(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate(),
                                      ),
                                    ),
                                  );
                                } else {
                                  field.handleChange(date);
                                }
                                setSubmitError(null);
                                setCalendarOpen(false);
                              }}
                              defaultMonth={field.state.value}
                              disabled={[
                                { before: utcStartOfToday() },
                                ...closedDates,
                              ]}
                              required={true}
                            />
                          </PopoverContent>
                        </Popover>

                        {closedDatesLoading && (
                          <p
                            className="text-[0.8125rem] mt-2"
                            style={{ color: MUTED }}
                          >
                            Checking which days are still open…
                          </p>
                        )}
                        {closedDatesFailed && (
                          <p
                            className="text-[0.8125rem] mt-2 flex flex-wrap items-center gap-x-2"
                            style={{ color: "#b45309" }}
                          >
                            We couldn&apos;t load full days just now.
                            <button
                              type="button"
                              onClick={loadClosedDates}
                              className="underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2"
                              style={focusRing}
                            >
                              Try again
                            </button>
                          </p>
                        )}

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

            {/* ── STEP 2: Party size + price ── */}
            {step === 2 && (
              <form.Subscribe
                selector={(state) => ({
                  date: state.values.date,
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ date, adults, kids }) => (
                  <div className="space-y-6">
                    <div className="space-y-5">
                      <form.Field
                        name="numberOfPeople"
                        children={(field) => (
                          <CountStepper
                            id={field.name}
                            label="Adults"
                            hint="9 years and over"
                            value={field.state.value}
                            display={adultsInput}
                            onDisplayChange={setAdultsInput}
                            onCommit={field.handleChange}
                            min={1}
                            max={100}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      <div
                        className="border-t"
                        style={{ borderColor: HAIRLINE }}
                      />
                      <form.Field
                        name="numberOfKids"
                        children={(field) => (
                          <CountStepper
                            id={field.name}
                            label="Children"
                            hint="5–8 years · under 5 free"
                            value={field.state.value ?? 0}
                            display={kidsInput}
                            onDisplayChange={setKidsInput}
                            onCommit={field.handleChange}
                            min={0}
                            max={100}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </div>

                    {date && (adults > 0 || (kids ?? 0) > 0) && (
                      <PriceBreakdown
                        date={date}
                        adults={adults}
                        kids={kids ?? 0}
                      />
                    )}

                    {/* House policy — stated, not silently enforced */}
                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: policyPrompted && !policyAccepted
                          ? "#fecaca"
                          : HAIRLINE,
                        background:
                          policyPrompted && !policyAccepted
                            ? "#fef2f2"
                            : "#ffffff",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="group-policy"
                          checked={policyAccepted}
                          onCheckedChange={(v) => {
                            setPolicyAccepted(!!v);
                            if (v) setPolicyPrompted(false);
                          }}
                          className="mt-0.5 size-5"
                        />
                        <div className="min-w-0">
                          <label
                            htmlFor="group-policy"
                            className="text-[0.875rem] leading-snug cursor-pointer select-none block"
                            style={{ color: NAVY }}
                          >
                            I confirm we&apos;re a mixed group or a family.
                          </label>
                          <p
                            className="text-[0.8125rem] mt-1.5 leading-relaxed"
                            style={{ color: MUTED }}
                          >
                            Fins admits mixed groups and families only. Groups
                            that don&apos;t meet this may be turned away at the
                            gate.
                          </p>
                          {policyPrompted && !policyAccepted && (
                            <p
                              role="alert"
                              className="text-[0.8125rem] mt-2.5 leading-relaxed"
                              style={{ color: "#b91c1c" }}
                            >
                              We need this confirmed before you continue. If
                              your group doesn&apos;t fit,{" "}
                              <a
                                href={WHATSAPP_HREF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 font-[600]"
                              >
                                message us on WhatsApp
                              </a>{" "}
                              and we&apos;ll see what we can do.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── STEP 3: Contact details + summary ── */}
            {step === 3 && (
              <form.Subscribe
                selector={(state) => ({
                  date: state.values.date,
                  adults: state.values.numberOfPeople,
                  kids: state.values.numberOfKids,
                })}
                children={({ date, adults, kids }) => (
                  <div className="space-y-6">
                    {date && (
                      <div
                        className="rounded-2xl border p-5"
                        style={{ borderColor: HAIRLINE, background: TINT }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="min-w-0">
                            <p
                              className="text-[0.9375rem] font-[600]"
                              style={{ color: NAVY }}
                            >
                              {format(date, "EEEE d MMMM")}
                            </p>
                            <p
                              className="text-[0.8125rem] mt-0.5"
                              style={{ color: MUTED }}
                            >
                              {adults} {adults === 1 ? "adult" : "adults"}
                              {(kids ?? 0) > 0 &&
                                ` · ${kids} ${kids === 1 ? "child" : "children"}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => goToStep(1)}
                            className="shrink-0 inline-flex items-center gap-1.5 text-[0.8125rem] rounded-full px-3 py-2 border focus-visible:outline-none focus-visible:ring-2"
                            style={{
                              color: NAVY,
                              borderColor: HAIRLINE,
                              background: "#fff",
                              ...focusRing,
                            }}
                          >
                            <Pencil className="size-3" aria-hidden="true" />
                            Edit
                          </button>
                        </div>
                        <div
                          className="pt-4 border-t flex items-baseline justify-between"
                          style={{ borderColor: HAIRLINE }}
                        >
                          <span className={eyebrow} style={{ color: MUTED }}>
                            Total
                          </span>
                          <span
                            className="font-[family-name:var(--font-raleway)] text-[2.5rem] font-[200] tracking-[-0.02em] tabular-nums leading-none"
                            style={{ color: NAVY }}
                          >
                            {formatEGP(
                              calculateDayUsePrice(date, adults, kids ?? 0)
                                .totalCents,
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <FieldGroup>
                      <form.Field
                        name="name"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-[0.9375rem] font-[600]"
                                style={{ color: NAVY }}
                              >
                                Full name
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
                                placeholder="First and family name"
                                autoComplete="name"
                                disabled={isSubmitting}
                                className="rounded-full min-h-11 text-[0.9375rem]"
                                style={{ borderColor: HAIRLINE }}
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
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-[0.9375rem] font-[600]"
                                style={{ color: NAVY }}
                              >
                                Email
                              </FieldLabel>
                              <Input
                                id={field.name}
                                type="email"
                                inputMode="email"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                placeholder="you@example.com"
                                autoComplete="email"
                                disabled={isSubmitting}
                                className="rounded-full min-h-11 text-[0.9375rem]"
                                style={{ borderColor: HAIRLINE }}
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
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-[0.9375rem] font-[600]"
                                style={{ color: NAVY }}
                              >
                                Phone
                              </FieldLabel>
                              <PhoneInput
                                id={field.name}
                                type="text"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={field.handleChange}
                                aria-invalid={isInvalid}
                                defaultCountry="EG"
                                autoComplete="tel"
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
                        name="instagram"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-[0.9375rem] font-[600]"
                                style={{ color: NAVY }}
                              >
                                Instagram
                              </FieldLabel>
                              <Input
                                id={field.name}
                                type="text"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                aria-describedby="instagram-help"
                                placeholder="@yourhandle"
                                autoComplete="off"
                                disabled={isSubmitting}
                                className="rounded-full min-h-11 text-[0.9375rem]"
                                style={{ borderColor: HAIRLINE }}
                              />
                              <p
                                id="instagram-help"
                                className="text-[0.8125rem] leading-relaxed"
                                style={{ color: MUTED }}
                              >
                                We check social accounts as part of confirming a
                                booking — it&apos;s how we keep the club feeling
                                the way it does. A private account is fine.
                              </p>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </FieldGroup>

                    {/* What actually happens after Reserve */}
                    <div
                      className="rounded-2xl border p-4 space-y-1.5"
                      style={{ borderColor: HAIRLINE, background: "#fff" }}
                    >
                      {[
                        // Two server paths exist: returning guests go straight
                        // to payment, new ones wait on an availability review.
                        // This wording stays true for both.
                        "No payment now — nothing is charged on this screen.",
                        "We'll confirm your day on WhatsApp, usually within 24 hours.",
                        "You'll then get a payment link that stays valid for 24 hours.",
                      ].map((line) => (
                        <p
                          key={line}
                          className="text-[0.8125rem] leading-relaxed flex gap-2"
                          style={{ color: MUTED }}
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-1 rounded-full shrink-0"
                            style={{ background: SKY }}
                          />
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}
          </form>

          {/* ── Footer action ── */}
          <div className="mt-7">
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className={cn(
                  eyebrow,
                  "w-full rounded-full min-h-12 hover:opacity-90 transition-opacity",
                )}
                style={{ background: SKY, color: NAVY }}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                form="day-use-booking-form"
                disabled={isSubmitting}
                className={cn(
                  eyebrow,
                  "w-full rounded-full min-h-12 hover:opacity-90 transition-opacity",
                )}
                style={{ background: SKY, color: NAVY }}
              >
                {isSubmitting ? "Reserving…" : "Reserve my day"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayUseBookingForm;
