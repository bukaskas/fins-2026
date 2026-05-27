import { BookingStatus } from "@prisma/client";
import { MessageCircle } from "lucide-react";

import { CopyButton } from "./CopyButton";

const WHATSAPP_NUMBER = "201080500099";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const WHATSAPP_DISPLAY = "+20 108 050 0099";
const ACCOUNT_NUMBER = "1105202510010201";
const BANK_NAME = "Arab African International Bank";
const ACCOUNT_NAME = "Fins Kite Surfing";

const SCREENSHOT_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
];

type Variant = "screenshots" | "payment";

function getVariant(status: BookingStatus): Variant | null {
  if (SCREENSHOT_STATUSES.includes(status)) return "screenshots";
  if (status === BookingStatus.WAITING_PAYMENT) return "payment";
  return null;
}

export default function NextStepCard({ status }: { status: BookingStatus }) {
  const variant = getVariant(status);
  if (!variant) return null;

  const tintColor =
    variant === "payment" ? "rgba(237, 230, 248, 0.55)" : "rgba(252, 230, 213, 0.55)";

  return (
    <section className="mt-14">
      <div
        className="relative overflow-hidden rounded-[28px] ring-1 ring-white/60"
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
            background: `radial-gradient(40rem 22rem at 50% -20%, ${tintColor} 0%, transparent 60%)`,
          }}
        />

        <div className="relative px-7 pt-7 pb-7 md:px-10 md:pt-10 md:pb-10">
          {variant === "screenshots" ? <ScreenshotsBody /> : <PaymentBody />}
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
    <h2
      className="mt-3 font-[family-name:var(--font-raleway)] text-[1.75rem] md:text-[2rem] font-[200] tracking-[-0.015em] text-[#1a1614] leading-[1.1]"
    >
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
          {WHATSAPP_DISPLAY}
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

function ScreenshotsBody() {
  return (
    <>
      <Eyebrow>Next step</Eyebrow>
      <Heading>Send the guests&rsquo; Instagram handles</Heading>
      <Body>
        We&rsquo;re reviewing your booking. Please send us screenshots of the Instagram accounts
        of the guests joining you, so we can confirm your reservation.
      </Body>
      <div className="mt-7">
        <WhatsAppButton caption="Send on WhatsApp" />
      </div>
    </>
  );
}

function PaymentBody() {
  return (
    <>
      <Eyebrow>Complete your booking</Eyebrow>
      <Heading>Send a 50% deposit to confirm</Heading>
      <Body>
        Your reservation is on hold pending payment. The deposit is{" "}
        <span className="text-[#1a1614] font-[500]">non-refundable</span> and reservations{" "}
        <span className="text-[#1a1614] font-[500]">cannot be postponed</span>.
      </Body>

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
            <CopyButton value={ACCOUNT_NUMBER} toastLabel="Account number copied" />
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
