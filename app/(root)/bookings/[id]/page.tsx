import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getServerSession } from "next-auth/next";
import { ArrowLeft, Pencil, Phone, Mail, MessageCircle, Instagram } from "lucide-react";
import { BookingStatus, Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { instagramHref } from "@/lib/utils";
import { getBookingById } from "@/lib/actions/booking.actions";
import PartyEditDialog from "./PartyEditDialog";
import StatusEditDialog from "./StatusEditDialog";
import NextStepCard from "./NextStepCard";

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

const STATUS_TONE: Record<
  BookingStatus,
  { label: string; bg: string; ring: string; text: string; dot: string }
> = {
  PENDING:             { label: "Pending",         bg: "#FFF4E0", ring: "#F2D9A6", text: "#7A5414", dot: "#E8A23E" },
  REQUEST_SENT:        { label: "Request sent",    bg: "#E4F1FA", ring: "#BCD8EA", text: "#1E4F72", dot: "#5BA6D6" },
  UNDER_REVIEW:        { label: "Under review",    bg: "#FCE6D5", ring: "#F1C9AA", text: "#7A3E18", dot: "#E68A4D" },
  WAITING_PAYMENT:     { label: "Waiting payment", bg: "#EDE6F8", ring: "#D4C5EE", text: "#4B348A", dot: "#9C82DC" },
  CONFIRMED:           { label: "Confirmed",       bg: "#E2F0E6", ring: "#BFDDC8", text: "#1F5B36", dot: "#62B07F" },
  ARRIVED:             { label: "Arrived",         bg: "#DDEFEE", ring: "#B6D9D6", text: "#16554F", dot: "#4FAEA6" },
  DECLINED:            { label: "Declined",        bg: "#FBE3E1", ring: "#F1C0BB", text: "#7E2A23", dot: "#D86158" },
  NO_RESPONSE_EXPIRED: { label: "No response",     bg: "#EFEEEC", ring: "#D9D6D1", text: "#4B4640", dot: "#9C9690" },
  CANCELED:            { label: "Canceled",        bg: "#F2F1EE", ring: "#DCD9D3", text: "#615C55", dot: "#A8A39B" },
};

const SERVICE_LABEL: Record<string, string> = {
  "kitesurfing-course": "Kitesurfing course",
  "day-use":            "Day use",
  "restaurant":         "Restaurant",
  "pharaoh-airstyle":   "Pharaoh Airstyle",
};

function fmtEGP(cents: number): string {
  return new Intl.NumberFormat("en-EG").format(Math.round(cents / 100));
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, session] = await Promise.all([
    getBookingById(id),
    getServerSession(authOptions),
  ]);

  if (!booking) notFound();

  const role = (session?.user as { role?: Role } | undefined)?.role;
  const isStaff = !!role && STAFF_ROLES.includes(role);

  const status = STATUS_TONE[booking.bookingStatus];
  const service =
    SERVICE_LABEL[booking.service] ?? booking.service.replace(/-/g, " ");

  const date = new Date(booking.date);
  const dayName = format(date, "EEEE");
  const dayNum = format(date, "d");
  const monthYear = format(date, "MMMM yyyy");

  const adults = booking.numberOfPeople ?? 0;
  const kids = booking.numberOfKids ?? 0;
  const totalPeople = adults + kids;

  const paid = booking.amountPaidCents ?? 0;
  const total = booking.totalPriceCents ?? 0;
  const paidPct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const balance = Math.max(0, total - paid);

  const phoneDigits = digits(booking.phone);

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* soft beach ambience: layered pastel gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, #E4F1FA 0%, transparent 60%), radial-gradient(50rem 38rem at -10% 110%, #FFE4D6 0%, transparent 55%), radial-gradient(40rem 30rem at 50% 50%, #FAF4E8 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-20 sm:px-6 sm:pt-10">
        {/* top utility bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          {isStaff ? (
            <Link
              href="/bookings"
              className="group inline-flex items-center gap-2 text-[#5b5650] hover:text-[#1a1614] transition-colors"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full border border-[#ece8e3] bg-white/70 backdrop-blur-sm transition-colors group-hover:border-[#d6d0c8]">
                <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.22em] uppercase font-[600]">
                Bookings
              </span>
            </Link>
          ) : (
            <span />
          )}

          <span className="font-[family-name:var(--font-roboto-mono)] text-[0.62rem] tracking-[0.12em] uppercase text-[#b0a89f]">
            #{booking.id.slice(0, 8)}
          </span>
        </div>

        {/* hero: guest is the headline — date sits compact to the right */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-5 flex-wrap-reverse">
            {/* left: guest identity + contacts */}
            <div className="min-w-0 flex-1">
              <span className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
                Guest
              </span>
              <h1
                className="mt-2 font-[family-name:var(--font-raleway)] font-[200] tracking-[-0.015em] text-[#1a1614] leading-[1.04]"
                style={{ fontSize: "clamp(2.1rem, 7vw, 3.25rem)" }}
              >
                {booking.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                {phoneDigits && (
                  <ContactLink
                    href={`tel:${phoneDigits}`}
                    icon={<Phone className="size-3" strokeWidth={1.5} />}
                    label={booking.phone}
                  />
                )}
                {phoneDigits && (
                  <ContactLink
                    href={`https://wa.me/${phoneDigits}`}
                    icon={<MessageCircle className="size-3" strokeWidth={1.5} />}
                    label="WhatsApp"
                    external
                  />
                )}
                {booking.email && (
                  <ContactLink
                    href={`mailto:${booking.email}`}
                    icon={<Mail className="size-3" strokeWidth={1.5} />}
                    label={booking.email}
                  />
                )}
                {booking.instagram && (
                  <ContactLink
                    href={instagramHref(booking.instagram)}
                    icon={<Instagram className="size-3" strokeWidth={1.5} />}
                    label={booking.instagram}
                    external
                  />
                )}
              </div>
            </div>

            {/* right: status + compact date card */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              {isStaff ? (
                <StatusEditDialog
                  bookingId={booking.id}
                  status={booking.bookingStatus}
                  tones={STATUS_TONE}
                />
              ) : (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
                  style={{
                    background: status.bg,
                    borderColor: status.ring,
                    color: status.text,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: status.dot, boxShadow: `0 0 0 3px ${status.bg}, 0 0 0 4px ${status.dot}30` }}
                  />
                  <span className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.2em] uppercase font-[700]">
                    {status.label}
                  </span>
                </div>
              )}

              <div className="text-right">
                <div className="font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.18em] uppercase font-[600] text-[#b0a89f]">
                  {dayName}
                </div>
                <div className="mt-0.5 flex items-baseline justify-end gap-1.5">
                  <span className="font-[family-name:var(--font-raleway)] text-[2.1rem] font-[100] leading-none tracking-[-0.03em] text-[#1a1614]">
                    {dayNum}
                  </span>
                  <span className="font-[family-name:var(--font-raleway)] text-[0.85rem] font-[300] tracking-[0.02em] text-[#5b5650]">
                    {monthYear}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-2 font-[family-name:var(--font-raleway)] text-[0.72rem] font-[400] text-[#5b5650]">
                  <span>{service}</span>
                  {booking.time && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-[#d6d0c8]" />
                      <span className="font-[family-name:var(--font-roboto-mono)] text-[0.68rem] tracking-[0.04em]">
                        {booking.time}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* next step — conditional on status, sits right under the date */}
        <NextStepCard
          status={booking.bookingStatus}
          totalPriceCents={total}
          amountPaidCents={paid}
        />

        {/* hairline */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#ece8e3] to-transparent mb-8" />

        {/* grid: party + deposit */}
        <section className="grid grid-cols-2 gap-x-8 gap-y-9">
          {/* party */}
          <div>
            <SectionLabel>Party</SectionLabel>
            {isStaff ? (
              <PartyEditDialog
                bookingId={booking.id}
                adults={adults}
                kids={kids}
                service={booking.service}
                dateIso={date.toISOString()}
              />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-raleway)] text-[2.75rem] sm:text-[3.5rem] font-[100] leading-none tracking-[-0.03em] text-[#1a1614]">
                    {totalPeople}
                  </span>
                  <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#8a8480]">
                    {totalPeople === 1 ? "person" : "people"}
                  </span>
                </div>
                <div className="mt-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#5b5650] font-[400]">
                  {adults} {adults === 1 ? "adult" : "adults"}
                  {kids > 0 && (
                    <>
                      <span className="mx-1.5 text-[#d6d0c8]">·</span>
                      {kids} {kids === 1 ? "kid" : "kids"}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* deposit */}
          <div>
            <SectionLabel>Deposit paid</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-raleway)] text-[3.5rem] font-[100] leading-none tracking-[-0.03em] text-[#1a1614]">
                {fmtEGP(paid)}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400] text-[#8a8480]">
                EGP
              </span>
            </div>

            {total > 0 ? (
              <>
                <div className="mt-4 h-[3px] rounded-full bg-[#ece8e3] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${paidPct}%`,
                      background:
                        paidPct >= 100
                          ? "linear-gradient(90deg, #62B07F, #4FAEA6)"
                          : "linear-gradient(90deg, #5BA6D6, #9C82DC)",
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between font-[family-name:var(--font-raleway)] text-[0.72rem] text-[#8a8480]">
                  <span>
                    of{" "}
                    <span className="font-[family-name:var(--font-roboto-mono)] text-[0.7rem] text-[#5b5650]">
                      {fmtEGP(total)} EGP
                    </span>
                  </span>
                  <span>
                    {paidPct >= 100 ? (
                      <span className="text-[#1F5B36] font-[600] tracking-[0.06em] uppercase text-[0.62rem]">
                        Settled
                      </span>
                    ) : (
                      <>
                        <span className="font-[family-name:var(--font-roboto-mono)] text-[0.7rem] text-[#5b5650]">
                          {fmtEGP(balance)} EGP
                        </span>{" "}
                        remaining
                      </>
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className="mt-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#8a8480]">
                Total price not set
              </div>
            )}
          </div>

          {/* assignment (only if relevant) */}
          {(booking.agent || booking.instructor) && (
            <div className="col-span-2 pt-6 border-t border-[#ece8e3] grid grid-cols-2 gap-8">
              {booking.instructor && (
                <div>
                  <SectionLabel>Instructor</SectionLabel>
                  <p className="font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] text-[#1a1614]">
                    {booking.instructor}
                  </p>
                </div>
              )}
              {booking.agent && (
                <div>
                  <SectionLabel>Handled by</SectionLabel>
                  <p className="font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] text-[#1a1614]">
                    {booking.agent.name ?? booking.agent.email}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* edit action — staff only */}
        {isStaff && (
          <div className="mt-12 flex justify-end">
            <Link
              href={`/bookings/${booking.id}/edit`}
              className="group inline-flex items-center gap-2 rounded-full bg-[#1a1614] px-6 py-3 text-white font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.18em] uppercase font-[600] transition-transform hover:-translate-y-px hover:bg-[#2a2522]"
            >
              <Pencil className="size-3.5" strokeWidth={1.5} />
              Edit booking
            </Link>
          </div>
        )}

        {/* footer mono detail */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-[#ece8e3]" />
          <span className="font-[family-name:var(--font-roboto-mono)] text-[0.6rem] tracking-[0.2em] uppercase text-[#b0a89f]">
            Booked {format(new Date(booking.createdAt), "d MMM yyyy")}
          </span>
          <span className="h-px w-8 bg-[#ece8e3]" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.22em] uppercase font-[600] text-[#b0a89f]">
      {children}
    </div>
  );
}

function ContactLink({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-[#ece8e3] bg-white/70 backdrop-blur-sm px-3.5 py-1.5 text-[#5b5650] hover:border-[#d6d0c8] hover:text-[#1a1614] transition-colors"
    >
      <span className="text-[#b0a89f]">{icon}</span>
      <span className="font-[family-name:var(--font-raleway)] text-[0.78rem] font-[400]">
        {label}
      </span>
    </a>
  );
}
