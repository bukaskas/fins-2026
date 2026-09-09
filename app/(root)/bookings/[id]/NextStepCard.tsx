import { BookingStatus } from "@prisma/client";
import { Instagram, Check, MessageCircle, BookmarkCheck } from "lucide-react";

import { CopyButton } from "./CopyButton";
import PayDepositOnline from "./PayDepositOnline";
import PaymentCountdown from "./PaymentCountdown";
import { WAITING_PAYMENT_WINDOW_MS } from "@/lib/constants";
import { FOCUS_RING } from "@/lib/bookings/status";

const INSTAGRAM_URL = "https://ig.me/m/finskitesurfing";
const INSTAGRAM_DISPLAY = "@finskitesurfing";
const ACCOUNT_NUMBER = "1105202510010201";
const BANK_NAME = "Arab African International Bank";
const ACCOUNT_NAME = "Fins Kite Surfing";
const WHATSAPP_NUMBER = "+201222144388";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

const SCREENSHOT_STATUSES: BookingStatus[] = [
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
];

type Variant = "pending" | "screenshots" | "payment" | "confirmed";

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
  bookingId,
  paymentLink = null,
  paymentLinkExpiresAt = null,
  waitingPaymentAt = null,
}: {
  status: BookingStatus;
  totalPriceCents?: number;
  amountPaidCents?: number;
  bookingId: string;
  paymentLink?: string | null;
  paymentLinkExpiresAt?: Date | string | null;
  waitingPaymentAt?: Date | string | null;
}) {
  const variant = getVariant(status);
  if (!variant) return null;

  const remainingCents = Math.max(0, totalPriceCents - amountPaidCents);

  // Deadline for the 24h payment window (ISO string for the client countdown).
  const paymentDeadline = waitingPaymentAt
    ? new Date(
        new Date(waitingPaymentAt).getTime() + WAITING_PAYMENT_WINDOW_MS,
      ).toISOString()
    : null;

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-[#ece8e3] bg-white shadow-[0_1px_6px_rgba(26,22,20,0.08)]">
        <div className="px-6 py-6 md:px-8 md:py-7">
          {variant === "pending" && <PendingBody />}
          {variant === "screenshots" && <ScreenshotsBody />}
          {variant === "payment" && (
            <PaymentBody
              totalCents={totalPriceCents}
              amountPaidCents={amountPaidCents}
              bookingId={bookingId}
              paymentLink={paymentLink}
              paymentLinkExpiresAt={
                paymentLinkExpiresAt
                  ? new Date(paymentLinkExpiresAt).toISOString()
                  : null
              }
              deadline={paymentDeadline}
            />
          )}
          {variant === "confirmed" && (
            <ConfirmedBody remainingCents={remainingCents} />
          )}
        </div>
      </div>
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-raleway)] text-[1.75rem] md:text-[2rem] font-[400] tracking-[-0.015em] text-[#1a1614] leading-[1.1]">
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
    <div className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.16em] uppercase font-[600] text-[#6b6460]">
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
      className={`group flex min-h-12 items-center gap-4 rounded-2xl bg-[#1a1614] px-5 py-4 text-white transition-colors duration-150 hover:bg-[#2a2522] shadow-[0_8px_24px_-10px_rgba(26,22,20,0.5)] ${FOCUS_RING}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
        <Instagram className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.16em] uppercase font-[600] text-white/70">
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
      className={`group flex min-h-12 items-center gap-4 rounded-2xl bg-[#1a1614] px-5 py-4 text-white transition-colors duration-150 hover:bg-[#2a2522] shadow-[0_8px_24px_-10px_rgba(26,22,20,0.5)] ${FOCUS_RING}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
        <MessageCircle className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.16em] uppercase font-[600] text-white/70">
          {caption}
        </span>
        <span className="mt-0.5 font-[family-name:var(--font-roboto-mono)] text-[0.95rem] tracking-[0.04em]">
          {WHATSAPP_NUMBER}
        </span>
      </span>
    </a>
  );
}

function ConfirmedBody({ remainingCents }: { remainingCents: number }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_rgba(31,91,54,0.6)]"
        style={{ background: "linear-gradient(180deg, #62B07F, #4FAEA6)" }}
      >
        <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <Heading>Thank you for booking at Fins</Heading>
        <Body>Please show this reservation page on arrival.</Body>

        {remainingCents > 0 && (
          <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-white/70 ring-1 ring-[#ece8e3] px-4 py-3">
            <div>
              <MicroLabel>Pay on arrival</MicroLabel>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-raleway)] text-[1.6rem] font-[400] leading-none tracking-[-0.02em] text-[#1a1614]">
                  {fmtEGP(remainingCents)}
                </span>
                <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[400] text-[#6b6460]">
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

function PaymentBody({
  totalCents,
  amountPaidCents,
  bookingId,
  paymentLink,
  paymentLinkExpiresAt,
  deadline,
}: {
  totalCents: number;
  amountPaidCents: number;
  bookingId: string;
  paymentLink: string | null;
  paymentLinkExpiresAt: string | null;
  deadline: string | null;
}) {
  const depositCents = Math.round(totalCents / 2);
  const remainingCents = totalCents - depositCents;
  // What's still owed to reach the 50% deposit (in case part was already paid).
  const depositDueCents = Math.max(0, depositCents - amountPaidCents);

  return (
    <>
      <Heading>Pay 50% to confirm</Heading>
      <Body>
        Your booking is held for 24 hours. The deposit is non-refundable and
        cannot be moved to another date.
      </Body>

      {deadline && (
        <div className="mt-5">
          <PaymentCountdown deadline={deadline} />
        </div>
      )}

      {totalCents > 0 && (
        <dl className="mt-6 divide-y divide-[#ece8e3] border-y border-[#ece8e3]">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="font-[family-name:var(--font-raleway)] text-[0.88rem] font-[500] text-[#3a3531]">
              Pay now
            </dt>
            <dd className="flex items-baseline gap-1 text-right">
              <span className="font-[family-name:var(--font-roboto-mono)] text-[1.35rem] font-[500] leading-none tabular-nums text-[#1a1614]">
                {fmtEGP(depositDueCents)}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[400] text-[#6b6460]">
                EGP
              </span>
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="font-[family-name:var(--font-raleway)] text-[0.88rem] font-[500] text-[#3a3531]">
              On arrival
              <span className="mt-0.5 block text-[0.75rem] font-[400] text-[#6b6460]">
                Cash or Visa
              </span>
            </dt>
            <dd className="flex items-baseline gap-1 text-right">
              <span className="font-[family-name:var(--font-roboto-mono)] text-[1.35rem] font-[500] leading-none tabular-nums text-[#1a1614]">
                {fmtEGP(remainingCents)}
              </span>
              <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] font-[400] text-[#6b6460]">
                EGP
              </span>
            </dd>
          </div>
        </dl>
      )}

      {/* Primary action: pay the deposit online */}
      <div className="mt-6">
        <PayDepositOnline
          bookingId={bookingId}
          paymentLink={paymentLink}
          paymentLinkExpiresAt={paymentLinkExpiresAt}
        />
      </div>

      {/* The page is the receipt: the guest sees the booking flip to confirmed
          here, whichever way they paid — so tell them to keep the link. */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#faf9f7] px-4 py-3.5 ring-1 ring-[#ece8e3]">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EDE6F8] text-[#4B348A]">
          <BookmarkCheck className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <p className="font-[family-name:var(--font-raleway)] text-[0.85rem] font-[400] leading-[1.55] text-[#5b5650]">
          Keep this page. Once we&rsquo;ve received your payment, come back to
          this same link &mdash; your booking will show as confirmed here.
        </p>
      </div>

      {/* Secondary fallback: manual bank transfer */}
      <details className="group mt-4 border-t border-[#ece8e3] pt-2">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg font-[family-name:var(--font-raleway)] text-[0.82rem] font-[500] text-[#5b5650] transition-colors hover:text-[#1a1614] ${FOCUS_RING}`}>
          <span>Pay by bank transfer</span>
          <span aria-hidden="true" className="text-[1.1rem] leading-none text-[#6b6460] transition-transform group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="mt-5 grid grid-cols-1 gap-5">
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
                accessibleLabel="Copy bank account number"
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

        <p className="mt-5 font-[family-name:var(--font-raleway)] text-[0.9rem] font-[400] text-[#5b5650] leading-[1.55]">
          After paying, send a screenshot of the transaction with full details:
        </p>
        <div className="mt-4">
          <WhatsAppButton caption="Send screenshot on WhatsApp" />
        </div>
      </details>
    </>
  );
}
