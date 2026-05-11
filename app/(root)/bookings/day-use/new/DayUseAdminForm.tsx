"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { BookingStatus } from "@prisma/client";
import { toast } from "sonner";
import { createDayUseBookingAdmin } from "@/lib/actions/booking.actions";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING:             "Pending",
  REQUEST_SENT:        "Request Sent",
  UNDER_REVIEW:        "Under Review",
  WAITING_PAYMENT:     "Waiting Payment",
  CONFIRMED:           "Confirmed",
  ARRIVED:             "Arrived",
  DECLINED:            "Declined",
  NO_RESPONSE_EXPIRED: "No Response",
  CANCELED:            "Canceled",
};

const fieldBox =
  "rounded-2xl bg-[#f8fbff] border border-[#bae6fd]/60 px-4 py-3 focus-within:border-[#38bdf8]/60 transition-colors";
const labelStyle =
  "block text-[0.55rem] tracking-[0.22em] uppercase font-[700] text-[#94a3b8] mb-1.5";
const inputStyle =
  "w-full bg-transparent text-[0.92rem] font-[300] text-[#0c2340] placeholder:text-[#cbd5e1] focus:outline-none";

export default function DayUseAdminForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [date, setDate]           = useState<Date | null>(null);
  const [adultsStr, setAdultsStr] = useState("1");
  const [kidsStr, setKidsStr]     = useState("0");
  const [status, setStatus]       = useState<BookingStatus>(BookingStatus.PENDING);
  const [amountEgp, setAmountEgp] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { toast.error("Please pick a date"); return; }
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!phone.trim()) { toast.error("Phone is required"); return; }

    setSaving(true);
    const result = await createDayUseBookingAdmin({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      date,
      numberOfPeople: Math.max(1, parseInt(adultsStr) || 1),
      numberOfKids: Math.max(0, parseInt(kidsStr) || 0),
      bookingStatus: status,
      amountPaidCents: Math.round(parseFloat(amountEgp || "0") * 100),
    });
    setSaving(false);

    if (result.success) {
      toast.success("Booking created");
      router.push("/bookings/day-use");
    } else {
      toast.error(result.message ?? "Failed to create booking");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Name */}
      <div className={fieldBox}>
        <label className={labelStyle}>Full name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          disabled={saving}
          className={inputStyle}
          style={{ fontFamily: "var(--font-raleway)" }}
        />
      </div>

      {/* Email */}
      <div className={fieldBox}>
        <label className={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="guest@example.com"
          disabled={saving}
          className={inputStyle}
          style={{ fontFamily: "var(--font-raleway)" }}
        />
      </div>

      {/* Phone */}
      <div className={fieldBox}>
        <label className={labelStyle}>Phone</label>
        <div
          className="
            [&>div]:w-full
            [&_input]:bg-transparent [&_input]:text-[#0c2340]
            [&_input]:placeholder:text-[#cbd5e1]
            [&_input]:border-0 [&_input]:shadow-none
            [&_input]:ring-0 [&_input]:outline-none
            [&_input]:rounded-none [&_input]:h-auto
            [&_input]:py-0 [&_input]:px-0
            [&_input]:text-[0.92rem] [&_input]:font-[300]
            [&_button]:bg-transparent [&_button]:border-0
            [&_button]:shadow-none [&_button]:rounded-none
            [&_button]:text-[#94a3b8] [&_button]:px-0 [&_button]:pr-2
            [&_button]:h-auto [&_button]:py-0
            [&_button:hover]:bg-transparent [&_button:hover]:text-[#0ea5e9]
          "
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          <PhoneInput
            value={phone}
            onChange={setPhone}
            international
            defaultCountry="EG"
            disabled={saving}
          />
        </div>
      </div>

      {/* Date */}
      <div className={fieldBox}>
        <label className={labelStyle}>Date</label>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={saving}
              className="flex items-center gap-2 w-full text-left focus:outline-none disabled:opacity-40"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <span
                className="text-[0.92rem] font-[300]"
                style={{
                  color: date ? "#0c2340" : "#cbd5e1",
                  fontFamily: "var(--font-raleway)",
                }}
              >
                {date ? format(date, "d MMM yyyy") : "Pick a date"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={(d) => {
                if (d) {
                  setDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
                } else {
                  setDate(null);
                }
                setCalOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Adults + Kids */}
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldBox}>
          <label className={labelStyle}>Adults</label>
          <input
            type="number"
            min={1}
            value={adultsStr}
            onChange={(e) => setAdultsStr(e.target.value)}
            onBlur={() => setAdultsStr(String(Math.max(1, parseInt(adultsStr) || 1)))}
            disabled={saving}
            className={inputStyle}
            style={{ fontFamily: "var(--font-raleway)" }}
          />
        </div>
        <div className={fieldBox}>
          <label className={labelStyle}>Kids</label>
          <input
            type="number"
            min={0}
            value={kidsStr}
            onChange={(e) => setKidsStr(e.target.value)}
            onBlur={() => setKidsStr(String(Math.max(0, parseInt(kidsStr) || 0)))}
            disabled={saving}
            className={inputStyle}
            style={{ fontFamily: "var(--font-raleway)" }}
          />
        </div>
      </div>

      {/* Status */}
      <div className={fieldBox}>
        <label className={labelStyle}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          disabled={saving}
          className={`${inputStyle} appearance-none cursor-pointer`}
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {Object.values(BookingStatus).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Amount paid */}
      <div className={fieldBox}>
        <label className={labelStyle}>Amount paid (EGP)</label>
        <input
          type="number"
          min={0}
          step={1}
          value={amountEgp}
          onChange={(e) => setAmountEgp(e.target.value)}
          placeholder="0"
          disabled={saving}
          className={inputStyle}
          style={{ fontFamily: "var(--font-raleway)" }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-2xl text-[0.78rem] font-[700] tracking-[0.16em] uppercase transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
          color: "#fff",
          fontFamily: "var(--font-raleway)",
          boxShadow: "0 2px 12px rgba(14, 165, 233, 0.3)",
        }}
      >
        {saving ? "Creating…" : "Create Booking"}
      </button>
    </form>
  );
}
