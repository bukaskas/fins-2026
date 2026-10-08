"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import { CountStepper } from "@/components/day-use/DayUseBookingForm";
import { createKiteCommunityBooking } from "@/lib/actions/booking.actions";
import { kiteCommunityBookingSchema, type KiteCommunityBookingData } from "@/lib/validators";
import { cn } from "@/lib/utils";
import pharaohPhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import { PHARAOH_EVENT_HOURS } from "@/lib/constants";
import { KITE_COMMUNITY_PRICE_CENTS, formatEGP } from "@/lib/pricing";

/* ─────────────────────────────────────────────────────────────
   Kite community registration for Pharaoh Airstyle.
   Same visual world as DayUseBookingForm (pages/day-use.md), but
   one screen: no date to pick; 800 EGP per person, paid on arrival.
   The booking is confirmed the moment it's sent.
   ───────────────────────────────────────────────────────────── */
const NAVY = "#0c1a2e";
const SKY = "#38bdf8";
const MUTED = "#54657a";
const HAIRLINE = "#dbe3ec";
const TINT = "#f4f8fb";

const eyebrow =
  "font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.2em] uppercase font-[700]";

type TextField = "name" | "localSpot" | "email";
type Errors = Partial<Record<keyof KiteCommunityBookingData, string>>;

const TEXT_FIELDS: {
  key: TextField;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}[] = [
  { key: "name", label: "Full name", autoComplete: "name" },
  { key: "localSpot", label: "Local spot", placeholder: "e.g. Ras Sudr" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
];

export default function KiteCommunityRegistrationForm() {
  const router = useRouter();
  const [values, setValues] = React.useState({
    name: "",
    localSpot: "",
    email: "",
    phone: "",
    numberOfPeople: 1,
  });
  const [peopleInput, setPeopleInput] = React.useState("1");
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((s) => ({ ...s, [key]: value }));
    setErrors((s) => ({ ...s, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = kiteCommunityBookingSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof KiteCommunityBookingData;
        next[key] ??= issue.message;
      }
      setErrors(next);
      setSubmitError("Some details still need fixing. Check the highlighted fields.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await createKiteCommunityBooking(parsed.data);
    if (result.success && "bookingId" in result) {
      toast.success(result.message);
      router.push(`/bookings/${result.bookingId}`);
    } else {
      setSubmitError(result.message);
      toast.error(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen md:flex" style={{ background: TINT }}>
      {/* ── Brand rail: same as the public Pharaoh Airstyle form ── */}
      <div className="relative md:w-1/2 lg:w-[55%] h-60 sm:h-64 md:h-[calc(100vh-96px)] lg:h-[calc(100vh-110px)] md:self-start md:sticky md:top-[96px] lg:top-[110px] overflow-hidden">
        <Image
          src={pharaohPhoto}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
          className="object-cover object-[center_28%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${NAVY}f2 0%, ${NAVY}99 45%, ${NAVY}40 100%)`,
          }}
        />
        <div className="relative h-full flex flex-col justify-end md:justify-center p-6 sm:p-8 md:p-12 lg:p-16">
          <span className={cn(eyebrow, "mb-3 sm:mb-4")} style={{ color: SKY }}>
            Fins Beach Club, Kai Sokhna
          </span>
          <p className="font-[family-name:var(--font-raleway)] text-white leading-[0.95] mb-4 sm:mb-6">
            <span className="block text-[clamp(2rem,6vw,4rem)] font-[100] tracking-[-0.02em]">
              Pharaohs
            </span>
            <span className="block text-[clamp(2rem,6vw,4rem)] font-[800] tracking-[-0.02em]">
              Airstyle Competition
            </span>
          </p>
          <p className="sm:hidden text-white/85 text-[0.8125rem] font-[400]">
            <b className="font-[700] text-white">Fri 9 Oct</b> · {PHARAOH_EVENT_HOURS}
          </p>
          <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2">
            {[
              <>Friday <b className="font-[700] text-white">9 October</b> 2026</>,
              PHARAOH_EVENT_HOURS,
              "Kite competition",
            ].map((item, i) => (
              <span key={i} className="text-white/75 text-[0.8125rem] font-[300]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form column ── */}
      <div className="md:w-1/2 lg:w-[45%] flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-8 md:py-12">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-md mx-auto">
          <h1
            className="font-[family-name:var(--font-raleway)] text-[1.375rem] font-[600] tracking-[-0.01em] mb-1"
            style={{ color: NAVY }}
          >
            Kite Community
          </h1>
          <p className="text-[0.9375rem] leading-relaxed mb-7" style={{ color: MUTED }}>
            Register and join us for a day where the energy rises with the wind - featuring vibrant activities, live music, flavorful bites, and high-flying kitesurfing action.
          </p>

          <div className="space-y-5">
            {TEXT_FIELDS.map((f) => (
              <div key={f.key}>
                <label
                  htmlFor={`kite-${f.key}`}
                  className="block text-[0.875rem] font-[600] mb-1.5"
                  style={{ color: NAVY }}
                >
                  {f.label}
                </label>
                <Input
                  id={`kite-${f.key}`}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  value={values[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                  disabled={isSubmitting}
                  className="h-12 rounded-full px-5 bg-white"
                  style={{ borderColor: errors[f.key] ? "#ef4444" : HAIRLINE }}
                />
                {errors[f.key] && <FieldError msg={errors[f.key]!} />}
              </div>
            ))}

            <div>
              <label
                htmlFor="kite-phone"
                className="block text-[0.875rem] font-[600] mb-1.5"
                style={{ color: NAVY }}
              >
                Phone number
              </label>
              <PhoneInput
                id="kite-phone"
                className="[&_input]:h-12 [&_input]:bg-white [&_button]:h-12 [&_button]:bg-white"
                value={values.phone}
                onChange={(v) => set("phone", v)}
                aria-invalid={!!errors.phone}
                defaultCountry="EG"
                autoComplete="tel"
                disabled={isSubmitting}
              />
              {errors.phone && <FieldError msg={errors.phone} />}
            </div>

            <div
              className="rounded-2xl border bg-white px-4 py-4 space-y-4"
              style={{ borderColor: HAIRLINE }}
            >
              <CountStepper
                id="kite-people"
                label="Number of people"
                hint={`${formatEGP(KITE_COMMUNITY_PRICE_CENTS)} per person`}
                value={values.numberOfPeople}
                display={peopleInput}
                onDisplayChange={setPeopleInput}
                onCommit={(n) => set("numberOfPeople", n)}
                min={1}
                max={20}
                disabled={isSubmitting}
              />
              <div
                className="flex items-baseline justify-between border-t pt-4"
                style={{ borderColor: HAIRLINE }}
              >
                <span className="text-[0.875rem] font-[600]" style={{ color: NAVY }}>
                  Total, pay on arrival
                </span>
                <span className="text-[1.0625rem] font-[700]" style={{ color: NAVY }}>
                  {formatEGP(values.numberOfPeople * KITE_COMMUNITY_PRICE_CENTS)}
                </span>
              </div>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-5 text-[0.875rem]" style={{ color: "#b91c1c" }}>
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(eyebrow, "mt-7 w-full rounded-full min-h-12")}
            style={{ background: SKY, color: NAVY }}
          >
            {isSubmitting ? "Confirming…" : "Confirm my spot"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-[0.8125rem] mt-1.5" style={{ color: "#b91c1c" }}>
      {msg}
    </p>
  );
}
