"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import kitePhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import { toast } from "sonner";
import { createKitesurfingBookingFromPublic } from "@/lib/actions/lessons.actions";
import Image from "next/image";
import {
  KitesurfingBookingFormData,
  kitesurfingBookingFormSchema,
} from "@/lib/validators";
import { PhoneInput } from "./phoneInput";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

function KitesurfingBookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [date, setDate] = React.useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setDate(new Date(Date.now() + 86400000));
  }, []);

  const form = useForm({
    defaultValues: {
      name: "",
      date: date,
      email: "",
      phone: "",
      time: "",
      notes: null,
    } as KitesurfingBookingFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = kitesurfingBookingFormSchema.safeParse(value);
        if (result.success) return;
        const fieldErrors = result.error.flatten().fieldErrors;
        return fieldErrors as any;
      },
    },
    onSubmit: async ({ value }) => {
      if (!value.date || !value.time) {
        toast.error("Please fill in all required fields");
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await createKitesurfingBookingFromPublic(
          value as KitesurfingBookingFormData,
        );
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
    <div className="min-h-screen flex">
      {/* ── Left: cinematic photo ── */}
      <div className="hidden md:block md:w-1/2 lg:w-[58%] relative">
        <Image
          src={kitePhoto}
          alt="Kite surfer making a jump"
          fill
          className="object-cover"
          priority
        />
        {/* Edge fade into dark form panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-[#0c0c0c]/80" />
      </div>

      {/* ── Right: dark form panel ── */}
      <div className="flex-1 bg-[#0c0c0c] flex flex-col justify-center px-8 py-14 md:px-10 lg:px-14">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-10">
          <span className="h-px w-7 bg-[#38bdf8] shrink-0" />
          <span className="text-[#38bdf8] text-[0.55rem] tracking-[0.38em] uppercase font-[family-name:var(--font-raleway)] font-[600]">
            IKO Certified · Red Sea · Sokhna
          </span>
        </div>

        {/* Heading */}
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-raleway)] text-white leading-none">
            <span className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-[100] block mb-1 tracking-[-0.01em]">
              Book a
            </span>
            <span className="text-[clamp(3rem,6vw,4.8rem)] font-[800] text-[#38bdf8] block leading-none tracking-[-0.02em]">
              LESSON
            </span>
          </h1>
          <p className="text-white/30 text-[0.8rem] font-[300] font-[family-name:var(--font-raleway)] mt-4 leading-relaxed">
            Reserve your spot on the water —<br className="hidden lg:block" /> we'll confirm within 24 hours.
          </p>
        </div>

        <form
          id="kite-booking-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* Name */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div
                  className={cn(
                    "border-b pb-2 mb-7 transition-colors duration-200",
                    isInvalid
                      ? "border-red-500/50"
                      : "border-white/15 focus-within:border-white/35",
                  )}
                >
                  <label
                    htmlFor={field.name}
                    className="text-white/35 text-[0.55rem] tracking-[0.28em] uppercase font-[700] font-[family-name:var(--font-raleway)] block mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="First and family name"
                    autoComplete="off"
                    disabled={isSubmitting}
                    className="bg-transparent text-white w-full text-[0.95rem] font-[300] font-[family-name:var(--font-raleway)] placeholder:text-white/20 focus:outline-none disabled:opacity-40"
                  />
                  {isInvalid && (
                    <p className="text-red-400 text-[0.62rem] mt-1.5 font-[family-name:var(--font-raleway)]">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Email */}
          <form.Field
            name="email"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div
                  className={cn(
                    "border-b pb-2 mb-7 transition-colors duration-200",
                    isInvalid
                      ? "border-red-500/50"
                      : "border-white/15 focus-within:border-white/35",
                  )}
                >
                  <label
                    htmlFor={field.name}
                    className="text-white/35 text-[0.55rem] tracking-[0.28em] uppercase font-[700] font-[family-name:var(--font-raleway)] block mb-2"
                  >
                    Email
                  </label>
                  <input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Your email address"
                    disabled={isSubmitting}
                    className="bg-transparent text-white w-full text-[0.95rem] font-[300] font-[family-name:var(--font-raleway)] placeholder:text-white/20 focus:outline-none disabled:opacity-40"
                  />
                  {isInvalid && (
                    <p className="text-red-400 text-[0.62rem] mt-1.5 font-[family-name:var(--font-raleway)]">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Phone */}
          <form.Field
            name="phone"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div
                  className={cn(
                    "border-b pb-2 mb-7 transition-colors duration-200",
                    isInvalid
                      ? "border-red-500/50"
                      : "border-white/15 focus-within:border-white/35",
                  )}
                >
                  <label
                    htmlFor={field.name}
                    className="text-white/35 text-[0.55rem] tracking-[0.28em] uppercase font-[700] font-[family-name:var(--font-raleway)] block mb-2"
                  >
                    Phone
                  </label>
                  {/* Dark-styled phone input wrapper */}
                  <div
                    className="
                      [&>div]:w-full
                      [&_input]:bg-transparent [&_input]:text-white
                      [&_input]:placeholder:text-white/20
                      [&_input]:border-0 [&_input]:shadow-none
                      [&_input]:ring-0 [&_input]:outline-none
                      [&_input]:rounded-none [&_input]:h-auto
                      [&_input]:py-0 [&_input]:px-0
                      [&_input]:text-[0.95rem] [&_input]:font-[300]
                      [&_input]:font-[family-name:var(--font-raleway)]
                      [&_button]:bg-transparent [&_button]:border-0
                      [&_button]:shadow-none [&_button]:rounded-none
                      [&_button]:text-white/40 [&_button]:px-0 [&_button]:pr-2
                      [&_button]:h-auto [&_button]:py-0
                      [&_button:hover]:bg-transparent [&_button:hover]:text-white/70
                    "
                  >
                    <PhoneInput
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      international
                      defaultCountry="EG"
                      disabled={isSubmitting}
                    />
                  </div>
                  {isInvalid && (
                    <p className="text-red-400 text-[0.62rem] mt-1.5 font-[family-name:var(--font-raleway)]">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Date */}
          <form.Field
            name="date"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div
                  className={cn(
                    "border-b pb-2 mb-7 transition-colors duration-200",
                    isInvalid ? "border-red-500/50" : "border-white/15",
                  )}
                >
                  <label className="text-white/35 text-[0.55rem] tracking-[0.28em] uppercase font-[700] font-[family-name:var(--font-raleway)] block mb-2">
                    Arrival Date
                  </label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        className="bg-transparent text-left w-full font-[300] font-[family-name:var(--font-raleway)] text-[0.95rem] focus:outline-none disabled:opacity-40"
                      >
                        {field.state.value ? (
                          <span className="text-white">
                            {format(field.state.value, "PPP")}
                          </span>
                        ) : (
                          <span className="text-white/20">Pick a date</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.state.value ?? undefined}
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
                            field.handleChange(date ?? null);
                          }
                          setCalendarOpen(false);
                        }}
                        defaultMonth={field.state.value ?? undefined}
                        disabled={{ before: new Date() }}
                        required={true}
                      />
                    </PopoverContent>
                  </Popover>
                  {isInvalid && (
                    <p className="text-red-400 text-[0.62rem] mt-1.5 font-[family-name:var(--font-raleway)]">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Time slots */}
          <form.Field
            name="time"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div className="mb-10">
                  <label className="text-white/35 text-[0.55rem] tracking-[0.28em] uppercase font-[700] font-[family-name:var(--font-raleway)] block mb-3">
                    Arrival Time
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map((t) => {
                      const isSelected = field.state.value === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            field.handleChange(t);
                            field.handleBlur();
                          }}
                          className={cn(
                            "py-2.5 text-[0.7rem] font-[family-name:var(--font-raleway)] font-[600] tracking-[0.06em] border transition-all duration-150 disabled:opacity-40",
                            isSelected
                              ? "bg-[#38bdf8] border-[#38bdf8] text-[#0c0c0c]"
                              : "border-white/10 text-white/35 hover:border-[#38bdf8]/40 hover:text-white/70",
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {isInvalid && (
                    <p className="text-red-400 text-[0.62rem] mt-2 font-[family-name:var(--font-raleway)]">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Submit */}
          <button
            type="submit"
            form="kite-booking-form"
            disabled={isSubmitting}
            className="w-full bg-[#38bdf8] text-[#0c0c0c] font-[family-name:var(--font-raleway)] font-[700] tracking-[0.18em] uppercase text-[0.78rem] py-4 hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting…" : "Reserve My Spot"}
          </button>

          <button
            type="button"
            onClick={() => form.reset()}
            disabled={isSubmitting}
            className="w-full mt-4 text-center text-white/20 text-[0.6rem] tracking-[0.2em] uppercase font-[family-name:var(--font-raleway)] font-[600] hover:text-white/45 transition-colors disabled:opacity-30"
          >
            Reset form
          </button>
        </form>
      </div>
    </div>
  );
}

export default KitesurfingBookingForm;
