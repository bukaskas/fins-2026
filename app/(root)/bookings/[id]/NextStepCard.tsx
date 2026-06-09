import { BookingStatus } from "@prisma/client";
import { Instagram, Check, MessageCircle } from "lucide-react";

import { CopyButton } from "./CopyButton";

const INSTAGRAM_URL = "https://ig.me/m/finskitesurfing";
const INSTAGRAM_DISPLAY = "@finskitesurfing";
const ACCOUNT_NUMBER = "1105202510010201";
const BANK_NAME = "Arab African International Bank";
const ACCOUNT_NAME = "Fins Kite Surfing";
const WHATSAPP_NUMBER = "+201080500099";
const WHATSAPP_URL = "https://wa.me/201080500099";

const SCREENSHOT_STATUSES: BookingStatus[] = [
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
];

type Variant = "pending" | "screenshots" | "payment" | "confirmed";

const TINT: Record<Variant, string> = {
  pending: "rgba(214, 234, 248, 0.55)",
  payment: "rgba(237, 230, 248, 0.55)",
  screenshots: "rgba(252, 230, 213, 0.55)",
  confirmed: "rgba(226, 240, 230, 0.6)",
};

function getVariant(status: BookingStatus): Variant | null {
  if (status === BookingStatus.PENDING) return "pending";
  if (SCREENSHOT_STATUSES.includes(status)) return "screenshots";
  if (status === BookingStatus.WAITING_PAYMENT) return "payment";
  if (status === BookingStatus.CONFIRMED) return "confirmed";
  return null;
}

function fmtEGP(cents: number): string {
  return new Intl.NumberFormat("en-EG").format(Math.round(cents / 100));
}

export default function NextStepCard({
  status,
  totalPriceCents = 0,
  amountPaidCents = 0,
}: {
  status: BookingStatus;
  totalPriceCents?: number;
  amountPaidCents?: number;
}) {
  const variant = getVariant(status);
  if (!variant) return null;

  const remainingCents = Math.max(0, totalPriceCents - amountPaidCents);

  return (
    <section className="mt-8">
      <div
        className="relative overflow-hidden rounded-[24px] ring-1 ring-white/60"
        style={{
          background: "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
          boxShadow:
            "0 20px 50px -20px rgba(40, 32, 24, 0.18), 0 4px 16px -6px rgba(40, 32, 24, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(40rem 22rem at 50% -20%, ${TINT[variant]} 0%, transparent 60%)`,
          }}
        />

        <div className="relative px-6 py-6 md:px-8 md:py-7">
          {variant === "pending" && <PendingBody />}
          {variant === "screenshots" && <ScreenshotsBody />}
          {variant === "payment" && (
            <PaymentBody totalCents={totalPriceCents} />
          )}
          {variant === "confirmed" && (
            <ConfirmedBody remainingCents={remainingCents} />
          )}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.28em] uppercase font-[600] text-[#b0a89f]">
      {children}
    </span>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 font-[family-name:var(--font-raleway)] text-[1.75rem] md:text-[2rem] font-[200] tracking-[-0.015em] text-[#1a1614] leading-[1.1]">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 font-[family-name:var(--font-raleway)] text-[0.92rem] font-[400] text-[#5b5650] leading-[1.6] max-w-[34rem]">
      {children}
    </p>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.24em] uppercase font-[600] text-[#b0a89f]">
      {children}
    </div>
  );
}

function InstagramButton({ caption }: { caption: string }) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl bg-[#1a1614] px-5 py-4 text-white transition-all duration-150 ease-out hover:bg-[#2a2522] active:scale-[0.99] shadow-[0_8px_24px_-10px_rgba(26,22,20,0.5)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
        <Instagram className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.22em] uppercase font-[600] text-white/55">
          {caption}
        </span>
        <span className="mt-0.5 font-[family-name:var(--font-roboto-mono)] text-[0.95rem] tracking-[0.04em]">
          {INSTAGRAM_DISPLAY}
        </span>
      </span>
    </a>
  );
}

function WhatsAppButton({ caption }: { caption: string }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl bg-[#1a1614] px-5 py-4 text-white transition-all duration-150 ease-out hover:bg-[#2a2522] active:scale-[0.99] shadow-[0_8px_24px_-10px_rgba(26,22,20,0.5)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
        <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.22em] uppercase font-[600] text-white/55">
          {caption}
        </span>
        <span className="mt-0.5 font-[family-name:var(--font-roboto-mono)] text-[0.95rem] tracking-[0.04em]">
          {WHATSAPP_NUMBER}
        </span>
      </span>
    </a>
  );
}

function HairlineDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ece8e3] to-transparent" />
    </div>
  );
}

function ConfirmedBody({ remainingCents }: { remainingCents: number }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_rgba(31,91,54,0.6)]"
        style={{ background: "linear-gradient(180deg, #62B07F, #4FAEA6)" }}
      >
        <Check className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <Eyebrow>Confirmed</Eyebrow>
        <Heading>Thank you for booking at Fins</Heading>
        <Body>Please show this reservation page on arrival.</Body>

        {remainingCents > 0 && (
          <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-white/70 ring-1 ring-[#ece8e3] px-4 py-3">
            <div>
              <MicroLabel>Pay on arrival</MicroLabel>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-raleway)] text-[1.6rem] font-[200] leading-none tracking-[-0.02em] text-[#1a1614]">
                  {fmtEGP(remainingCents)}
                </span>
                <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] font-[400] text-[#8a8480]">
                  EGP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PendingBody() {
  return (
    <>
      <Eyebrow>Booking request received</Eyebrow>
      <Heading>Thank you for your booking request</Heading>
      <Body>
        Please let us check the availability and we&rsquo;ll get back to you as
        soon as possible.
      </Body>
      <div className="mt-7">
        <WhatsAppButton caption="Contact us on WhatsApp" />
      </div>
    </>
  );
}

function ScreenshotsBody() {
  return (
    <>
      <Eyebrow>Next step</Eyebrow>
      <Heading>Send the guests&rsquo; Instagram handles</Heading>
      <Body>
        We&rsquo;re reviewing your booking. Please send us screenshots of the
        Instagram accounts of the guests joining you, so we can confirm your
        reservation.
      </Body>
      <div className="mt-7">
        <InstagramButton caption="Send on Instagram" />
      </div>
    </>
  );
}

function PaymentBody({ totalCents }: { totalCents: number }) {
  const depositCents = Math.round(totalCents / 2);
  const remainingCents = totalCents - depositCents;

  return (
    <>
      <Eyebrow>Complete your booking</Eyebrow>
      <Heading>Send a 50% deposit to confirm</Heading>
      <Body>
        Your reservation is on hold pending payment. The deposit is{" "}
        <span className="text-[#1a1614] font-[500]">non-refundable</span> and
        reservations{" "}
        <span className="text-[#1a1614] font-[500]">cannot be postponed</span>.
      </Body>

      {totalCents > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/70 ring-1 ring-[#ece8e3] px-4 py-3.5">
            <MicroLabel>Pay now</MicroLabel>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-raleway)] text-[1.6rem] font-[200] leading-none tracking-[-0.02em] text-[#1a1614]">
                {fmtEGP(depositCents)}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] font-[400] text-[#8a8480]">
                EGP
              </span>
            </div>
            <div className="mt-1 font-[family-name:var(--font-raleway)] text-[0.68rem] font-[400] text-[#8a8480]">
              50% deposit
            </div>
          </div>

          <div className="rounded-2xl bg-white/40 ring-1 ring-[#ece8e3] px-4 py-3.5">
            <MicroLabel>On arrival</MicroLabel>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-raleway)] text-[1.6rem] font-[200] leading-none tracking-[-0.02em] text-[#1a1614]">
                {fmtEGP(remainingCents)}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.7rem] font-[400] text-[#8a8480]">
                EGP
              </span>
            </div>
            <div className="mt-1 font-[family-name:var(--font-raleway)] text-[0.68rem] font-[400] text-[#8a8480]">
              Remaining balance
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 font-[family-name:var(--font-raleway)] text-[0.82rem] font-[400] text-[#5b5650] leading-[1.55]">
        The full remaining amount is due{" "}
        <span className="text-[#1a1614] font-[500]">
          in cash or visa on arrival
        </span>
        .
      </p>

      <HairlineDivider />

      <div className="grid grid-cols-1 gap-5">
        <div>
          <MicroLabel>Bank</MicroLabel>
          <div className="mt-1.5 font-[family-name:var(--font-raleway)] text-[1rem] font-[400] text-[#1a1614]">
            {BANK_NAME}
          </div>
        </div>

        <div>
          <MicroLabel>Account number</MicroLabel>
          <div className="mt-2">
            <CopyButton
              value={ACCOUNT_NUMBER}
              toastLabel="Account number copied"
            />
          </div>
        </div>

        <div>
          <MicroLabel>Account name</MicroLabel>
          <div className="mt-1.5 font-[family-name:var(--font-raleway)] text-[1rem] font-[400] text-[#1a1614]">
            {ACCOUNT_NAME}
          </div>
        </div>
      </div>

      <HairlineDivider />

      <p className="font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] text-[#5b5650] leading-[1.55]">
        After payment, send a screenshot of the transaction with full details:
      </p>
      <div className="mt-4">
        <WhatsAppButton caption="Send screenshot on WhatsApp" />
      </div>
    </>
  );
}
