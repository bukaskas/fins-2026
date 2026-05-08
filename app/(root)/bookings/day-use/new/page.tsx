import Link from "next/link";
import DayUseAdminForm from "./DayUseAdminForm";

export default function NewDayUseBookingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #f0f9ff 0%, #faf7f2 50%, #f0fdf4 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#38bdf8] via-[#7dd3fc] to-[#86efac] opacity-60" />

      <div className="mx-auto max-w-lg px-5 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-[0.72rem] tracking-[0.08em] uppercase font-[600] text-[#94a3b8] hover:text-[#0ea5e9] transition-colors mb-6"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M7.5 2L3.5 6l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All bookings
          </Link>

          <p
            className="text-[0.6rem] tracking-[0.32em] uppercase font-[700] mb-2"
            style={{ color: "#38bdf8", fontFamily: "var(--font-raleway)" }}
          >
            Fins · Day Use
          </p>
          <h1
            className="text-[2rem] font-[200] tracking-[-0.02em] leading-none"
            style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
          >
            New{" "}
            <span className="font-[700] text-[#0ea5e9]">Booking</span>
          </h1>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 4px 24px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(0,0,0,0.06)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
          }}
        >
          <div className="px-7 pt-7 pb-7">
            <DayUseAdminForm />
          </div>
        </div>

        {/* Decorative dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8 opacity-30">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? 6 : 4,
                height: i === 1 ? 6 : 4,
                background: "#38bdf8",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
