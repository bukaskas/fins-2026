import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";
import { RATE_LABELS, formatEGP, type PriceBreakdown } from "@/lib/pricing";
import { LOCATION_ADDRESS, WHATSAPP_PHONE, VISIT_HOURS } from "@/lib/constants";

// Same derivation the site footer uses: local Egyptian number -> wa.me form.
const WHATSAPP_HREF = `https://wa.me/20${WHATSAPP_PHONE.substring(1)}`;

/**
 * Where a booking is on its way to the beach:
 * - request: PENDING, waiting for a staff review. A receipt, not a promise.
 * - awaiting-payment: WAITING_PAYMENT, the 24h deposit window is running.
 * - confirmed: the deposit landed and the seat is held.
 * - cancelled: the window ran out unpaid and the system released the seat.
 */
export type BookingEmailStage =
  | "request"
  | "awaiting-payment"
  | "confirmed"
  | "cancelled";

export interface BookingEmailProps {
  username?: string;
  /** Display-formatted date, e.g. "Saturday, 5 September". */
  date?: string;
  bookingType?: string;
  numberOfPeople?: number;
  numberOfKids?: number;
  /**
   * The exact breakdown the booking was priced with. Passed in whole so the
   * line items can never disagree with the total - the template does no
   * pricing arithmetic of its own.
   */
  priceBreakdown?: PriceBreakdown;
  bookingUrl?: string;
  stage?: BookingEmailStage;
  /** Total taken so far. Only rendered on the confirmed email. */
  amountPaidCents?: number;
  /**
   * What is still owed on arrival. Passed in rather than derived: the deposit
   * is 50% of a total this template deliberately never recomputes.
   */
  balanceDueCents?: number;
  /** The deposit still to pay online. Awaiting-payment only. */
  depositDueCents?: number;
  /** Fixed wall-clock deadline, e.g. "Tuesday 6 October, 14:30 (Cairo time)". */
  deadline?: string;
  /** The same deadline, short enough for the inbox preview line. */
  deadlineShort?: string;
  /** Where a released guest can start over. Cancelled only. */
  rebookUrl?: string;
}

interface BodyFacts {
  date?: string;
  deadline?: string;
}

interface StageCopy {
  heading: string;
  body: string | ((facts: BodyFacts) => string);
}

/**
 * Request and confirmed wording exists for every service. Awaiting-payment and
 * cancelled only for services that can actually reach those states through a
 * guest booking today; the rest use the service-agnostic fallback.
 */
type ServiceCopy = {
  request: StageCopy;
  confirmed: StageCopy;
  "awaiting-payment"?: StageCopy;
  cancelled?: StageCopy;
};

const releasedBody =
  (thing: string) =>
  ({ date, deadline }: BodyFacts) =>
    `We didn’t receive the deposit ${deadline ? `by ${deadline}` : "in time"}, so we released ${thing}${date ? ` for ${date}` : ""}.`;

const serviceContent: Record<string, ServiceCopy> = {
  "kitesurfing-course": {
    request: {
      heading: "We've received your kitesurfing request",
      body: "Thanks for booking with us. We'll be watching the forecast and will send you the exact time the day before — the wind here is hard to call any earlier than that. If there's a time you'd prefer, tell us and we'll try to build the day around it.",
    },
    confirmed: {
      heading: "Your kitesurfing session is booked",
      body: "Your payment came through and your session is booked. We'll be watching the forecast and will send you the exact time the day before — the wind here is hard to call any earlier than that.",
    },
  },
  "day-use": {
    request: {
      heading: "We've received your day-use request",
      body: "Thanks for booking a day with us. Here’s what you sent. We’ll check availability and come back to you.",
    },
    "awaiting-payment": {
      heading: "Pay your deposit to hold your day",
      body: "Good news — your date is available. Pay the deposit below to hold your spot.",
    },
    confirmed: {
      heading: "Your day-use booking is confirmed",
      // Kept apart from the request wording, which points at a conversation
      // that is over by now: telling a guest who has just paid that we'll check
      // things "before we speak" reads as though the payment didn't register.
      body: "Your payment came through and your spot is held. Everything you'll need for the day is below — worth a read before you travel.",
    },
    cancelled: {
      heading: "We released your spot",
      body: releasedBody("your spot"),
    },
  },
  restaurant: {
    request: {
      heading: "We've received your table request",
      body: "Thanks for choosing us. If you have any dietary requirements or you're celebrating something, tell us now and we'll have it ready before you sit down.",
    },
    confirmed: {
      heading: "Your table is booked",
      body: "Your payment came through and your table is booked. If you have any dietary requirements or you're celebrating something, tell us and we'll have it ready before you sit down.",
    },
  },
};

// Any service without its own copy gets wording that is true for all of them,
// rather than silently inheriting the kitesurfing text.
const fallbackContent: Required<ServiceCopy> = {
  request: {
    heading: "We've received your booking request",
    body: "Thanks for booking with us. Everything you asked for is below.",
  },
  "awaiting-payment": {
    heading: "Pay your deposit to hold your booking",
    body: "Good news — your date is available. Pay the deposit below to hold your booking.",
  },
  confirmed: {
    heading: "Your booking is confirmed",
    body: "Your payment came through and your booking is confirmed. Everything you asked for is below.",
  },
  cancelled: {
    heading: "We released your booking",
    body: releasedBody("your booking"),
  },
};

/** Day use is sold as a beach club; kitesurfing stays out of its emails. */
const footerName: Record<string, string> = {
  "day-use": "Fins Beach Club",
};
const fallbackFooterName = "Fins Kitesurfing Center";

const text = "text-[15px] leading-relaxed text-[#22303F] m-0";
const muted = "text-[13px] leading-relaxed text-[#5B6B7C] m-0";
const sectionHeading =
  "text-[17px] font-semibold text-[#22303F] mt-0 mb-2 mx-0 p-0";
const rule = "my-6 border-[#D6E0EA]";
const primaryButton =
  "inline-block rounded-[8px] bg-[#22303F] px-6 py-3.5 text-[15px] font-semibold text-white no-underline text-center";
const whatsappButton =
  "inline-block rounded-[8px] bg-green-500 px-6 py-3.5 text-[15px] font-semibold text-black no-underline text-center";
const secondaryButton =
  "inline-block rounded-[8px] border border-solid border-[#5B6B7C] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#22303F] no-underline text-center";

/** "2 adults · 1 child (5-8)", skipping whatever isn't there. */
function describeParty(adults: number, kids: number): string | null {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adult" : "adults"}`);
  if (kids > 0) parts.push(`${kids} ${kids === 1 ? "child" : "children"} (5–8)`);
  return parts.length ? parts.join(" · ") : null;
}

/** One label/amount line in the same column grid as the price breakdown. */
const AmountRow = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <Row className="mb-1">
    <Column className={`text-[15px] text-[#22303F] align-top ${strong ? "font-semibold" : ""}`}>
      {label}
    </Column>
    <Column
      className={`text-[15px] text-[#22303F] text-right align-top whitespace-nowrap ${strong ? "font-semibold" : ""}`}
    >
      {" "}
      {value}
    </Column>
  </Row>
);

interface PaymentRowsProps {
  stage: BookingEmailStage;
  amountPaidCents?: number;
  balanceDueCents?: number;
  depositDueCents?: number;
}

/**
 * The money lines that change with the stage: what to pay now while the window
 * is open, what was paid once it closed.
 */
const PaymentRows = ({
  stage,
  amountPaidCents,
  balanceDueCents,
  depositDueCents,
}: PaymentRowsProps) => {
  if (stage === "awaiting-payment") {
    return (
      <>
        {depositDueCents !== undefined && (
          <AmountRow label="Deposit to pay now" value={formatEGP(depositDueCents)} strong />
        )}
        {balanceDueCents !== undefined && balanceDueCents > 0 && (
          <AmountRow label="Due on arrival" value={formatEGP(balanceDueCents)} />
        )}
      </>
    );
  }
  if (stage !== "confirmed") return null;
  return (
    <>
      {amountPaidCents !== undefined && (
        <AmountRow label="Paid" value={formatEGP(amountPaidCents)} />
      )}
      {/* A settled booking says so outright; an unlabelled missing row reads as
          though we forgot to bill the rest. */}
      {balanceDueCents !== undefined && (
        <AmountRow
          label={balanceDueCents > 0 ? "Due on arrival" : "Nothing left to pay"}
          value={balanceDueCents > 0 ? formatEGP(balanceDueCents) : "—"}
          strong
        />
      )}
    </>
  );
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <Text className={`${text} mb-1`}>
    <span className="text-[#5B6B7C]">{label}: </span>
    <span className="font-semibold">{value}</span>
  </Text>
);

interface DayUseDetailsProps {
  date?: string;
  numberOfPeople?: number;
  numberOfKids?: number;
  priceBreakdown?: PriceBreakdown;
  stage: BookingEmailStage;
  amountPaidCents?: number;
  balanceDueCents?: number;
  depositDueCents?: number;
}

const DayUseDetails = ({
  date,
  numberOfPeople,
  numberOfKids,
  priceBreakdown,
  stage,
  amountPaidCents,
  balanceDueCents,
  depositDueCents,
}: DayUseDetailsProps) => {
  const adults = numberOfPeople ?? 0;
  const kids = numberOfKids ?? 0;
  const party = describeParty(adults, kids);

  return (
    <>
      <Hr className={rule} />

      <Heading as="h2" className={sectionHeading}>
        {stage === "request" ? "Your request" : "Your booking"}
      </Heading>

      {/* Label and value share one paragraph rather than two table cells:
          adjacent cells collapse into "DateSaturday" once a client renders
          the plain-text alternative. */}
      {date && <MetaRow label="Date" value={date} />}
      {party && <MetaRow label="Guests" value={party} />}
      <MetaRow label="Hours" value={VISIT_HOURS} />

      {/* Right under the request: a group that doesn't qualify should find out
          before it reads about lockers. */}
      <Section className="mt-4 rounded-[8px] bg-[#F2F6FA] px-4 py-3">
        <Text className="text-[15px] leading-relaxed text-[#22303F] font-semibold m-0">
          Mixed groups and families only
        </Text>
        <Text className={`${muted} mt-1`}>
          This one decides entry at the gate, so please check it before you
          travel.
        </Text>
      </Section>

      {/* Prices are rendered only when the booking was actually priced. An
          invented per-person figure was wrong on peak, best-value and
          child rates alike, so nothing is better than a guess here. */}
      {priceBreakdown && (
        <>
          <Hr className={rule} />

          <Heading as="h2" className={sectionHeading}>
            {stage === "confirmed" ? "Your payment" : "What you’ll pay"}
          </Heading>
          <Text className={`${muted} mb-3`}>
            {RATE_LABELS[priceBreakdown.rateType]} rate for this date.
          </Text>

          <Section>
            {adults > 0 && (
              <Row className="mb-1">
                <Column className="text-[15px] text-[#22303F] align-top">
                  {adults} × adult
                  <span className="text-[#5B6B7C]">
                    {" "}
                    at {formatEGP(priceBreakdown.adultUnitCents)}
                  </span>
                </Column>
                <Column className="text-[15px] text-[#22303F] text-right align-top whitespace-nowrap">
                  {" "}
                  {formatEGP(priceBreakdown.adultTotalCents)}
                </Column>
              </Row>
            )}
            {kids > 0 && (
              <Row className="mb-1">
                <Column className="text-[15px] text-[#22303F] align-top">
                  {kids} × child (5–8)
                  <span className="text-[#5B6B7C]">
                    {" "}
                    at {formatEGP(priceBreakdown.kidsUnitCents)}
                  </span>
                </Column>
                <Column className="text-[15px] text-[#22303F] text-right align-top whitespace-nowrap">
                  {" "}
                  {formatEGP(priceBreakdown.kidsTotalCents)}
                </Column>
              </Row>
            )}
            <Row>
              <Column
                style={{ borderTop: "1px solid #D6E0EA" }}
                className="text-[15px] font-semibold text-[#22303F] pt-2 align-top"
              >
                Total
              </Column>
              <Column
                style={{ borderTop: "1px solid #D6E0EA" }}
                className="text-[15px] font-semibold text-[#22303F] pt-2 text-right align-top whitespace-nowrap"
              >
                {" "}
                {formatEGP(priceBreakdown.totalCents)}
              </Column>
            </Row>
            <PaymentRows
              stage={stage}
              amountPaidCents={amountPaidCents}
              balanceDueCents={balanceDueCents}
              depositDueCents={depositDueCents}
            />
          </Section>

          {/* So the payment link that follows the review isn't a surprise. */}
          {stage === "request" && (
            <Text className={`${text} mt-3`}>
              Once we confirm, you&rsquo;ll pay a 50% deposit online; the rest
              is settled at reception.
            </Text>
          )}

          <Text className={`${muted} mt-3`}>
            Children under 5 join free — they don&rsquo;t need a ticket, so they
            aren&rsquo;t counted above.
          </Text>
        </>
      )}

      <Hr className={rule} />

      <Heading as="h2" className={sectionHeading}>
        What&rsquo;s included
      </Heading>
      <Text className={text}>Beach entrance</Text>
      <Text className={text}>Swimming pool</Text>
      <Text className={text}>Showers and lounges</Text>
      <Text className={text}>Lockers</Text>
      <Text className={`${muted} mt-2`}>
        We don&rsquo;t have rooms — day use only.
      </Text>

      <Hr className={rule} />

      <Heading as="h2" className={sectionHeading}>
        Please leave at home
      </Heading>
      <Text className={text}>Pets</Text>
      <Text className={text}>Cooler boxes</Text>
      <Text className={text}>Speakers</Text>
      <Text className={text}>Outside food and drinks</Text>
    </>
  );
};

function whatHappensNext({
  stage,
  balanceDueCents,
  depositDueCents,
  deadline,
  rebookUrl,
}: Pick<
  BookingEmailProps,
  "balanceDueCents" | "depositDueCents" | "deadline" | "rebookUrl"
> & { stage: BookingEmailStage }): string {
  switch (stage) {
    case "request":
      return `We check every request by hand and reply on WhatsApp during our opening hours, ${VISIT_HOURS}. If you booked late at night, expect to hear from us the next morning. Once we confirm, we'll email you a link to pay a 50% deposit. You'll have 24 hours to pay before the spot is released.`;
    case "awaiting-payment": {
      const what =
        depositDueCents !== undefined
          ? `the ${formatEGP(depositDueCents)} deposit`
          : "your deposit";
      const by = deadline ? ` by ${deadline}` : " within 24 hours";
      return `Pay ${what}${by} to hold your spot. If it hasn't arrived by then, the spot is released for other guests. The rest is settled at reception when you arrive. Trouble paying? Message us on WhatsApp.`;
    }
    case "confirmed":
      return balanceDueCents !== undefined && balanceDueCents > 0
        ? `You're on the list. Bring the remaining ${formatEGP(balanceDueCents)} with you — you can settle it at reception when you arrive. If anything changes, message us on WhatsApp and we'll sort it out.`
        : "You're on the list. If anything changes, message us on WhatsApp and we'll sort it out.";
    case "cancelled":
      return rebookUrl
        ? "If you'd still like to come, you can book again below. Questions? Message us on WhatsApp."
        : "If you'd still like to come, message us on WhatsApp and we'll see what we can do.";
  }
}

const BookingEmail = ({
  username,
  date,
  bookingType,
  numberOfPeople,
  numberOfKids,
  priceBreakdown,
  bookingUrl,
  stage = "request",
  amountPaidCents,
  balanceDueCents,
  depositDueCents,
  deadline,
  deadlineShort,
  rebookUrl,
}: BookingEmailProps) => {
  const mapped = bookingType ? serviceContent[bookingType] : undefined;
  if (bookingType && !mapped) {
    // Surface the gap instead of sending a guest the wrong service's email.
    console.error(
      `[emailTemplate] No copy for bookingType "${bookingType}" — sent the service-agnostic version.`,
    );
  }
  const copy = mapped?.[stage] ?? fallbackContent[stage];
  const body =
    typeof copy.body === "function" ? copy.body({ date, deadline }) : copy.body;
  const brand =
    (bookingType ? footerName[bookingType] : undefined) ?? fallbackFooterName;

  const isDayUse = bookingType === "day-use";
  const isCancelled = stage === "cancelled";
  const party = describeParty(numberOfPeople ?? 0, numberOfKids ?? 0);
  const paymentInDayUseTable = isDayUse && !!priceBreakdown;
  const hasPaymentInfo =
    stage === "awaiting-payment"
      ? depositDueCents !== undefined
      : stage === "confirmed" &&
        (amountPaidCents !== undefined || balanceDueCents !== undefined);
  const showStandalonePayment = hasPaymentInfo && !paymentInDayUseTable;

  // The inbox row is the second-most-read line in an email; spend it on the
  // facts the subject can't carry rather than repeating the heading.
  const previewParts: (string | null | undefined)[] =
    stage === "awaiting-payment"
      ? [
          `${depositDueCents !== undefined ? formatEGP(depositDueCents) : "Deposit"} due${
            deadlineShort ? ` by ${deadlineShort}` : ""
          }`,
          isDayUse ? party : null,
        ]
      : stage === "cancelled"
        ? [date ? `Spot released for ${date}` : "Spot released", rebookUrl ? "Book again anytime" : null]
        : [
            date,
            isDayUse ? party : null,
            stage === "confirmed" && amountPaidCents !== undefined
              ? `${formatEGP(amountPaidCents)} paid`
              : isDayUse && priceBreakdown
                ? formatEGP(priceBreakdown.totalCents)
                : null,
            stage === "confirmed" && balanceDueCents !== undefined && balanceDueCents > 0
              ? `${formatEGP(balanceDueCents)} due on arrival`
              : null,
            stage === "confirmed" ? "See you on the beach" : "We'll confirm on WhatsApp",
          ];
  const previewText = previewParts.filter(Boolean).join(" · ");

  return (
    <Html lang="en" dir="ltr">
      <Head>
        {/* ui-sans-serif / system-ui are unparseable by Outlook's Word engine,
            which then falls back to a serif. Name a real face and a real
            fallback instead. */}
        <Font fontFamily="Raleway" fallbackFontFamily={["Arial", "sans-serif"]} />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          // Emit px, not rem: Outlook's Word engine ignores rem outright.
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              fontFamily: { sans: ["Raleway", "Arial", "sans-serif"] },
            },
          },
        }}
      >
        <Body className="m-0 bg-white font-sans text-[#22303F]">
          <Container className="mx-auto my-0 max-w-[600px] px-6 py-10">
            <Heading className="text-[26px] font-semibold leading-tight text-[#22303F] text-start p-0 mt-0 mb-6 mx-0">
              {copy.heading}
            </Heading>

            <Text className={`${text} mb-4`}>
              Hello{username ? " " : ""}
              {/* Isolate the name so an Arabic name doesn't drag the comma
                  to the wrong side of the line. */}
              {username ? <bdi>{username}</bdi> : null},
            </Text>
            <Text className={text}>{body}</Text>

            {isDayUse && !isCancelled && (
              <DayUseDetails
                date={date}
                numberOfPeople={numberOfPeople}
                numberOfKids={numberOfKids}
                priceBreakdown={priceBreakdown}
                stage={stage}
                amountPaidCents={amountPaidCents}
                balanceDueCents={balanceDueCents}
                depositDueCents={depositDueCents}
              />
            )}

            {/* A released booking only needs naming, not the day's rules. */}
            {isDayUse && isCancelled && (
              <>
                <Hr className={rule} />
                <Heading as="h2" className={sectionHeading}>
                  The booking we released
                </Heading>
                {date && <MetaRow label="Date" value={date} />}
                {party && <MetaRow label="Guests" value={party} />}
              </>
            )}

            {!isDayUse && date && (
              <Text className={`${text} mt-4`}>
                <span className="text-[#5B6B7C]">Date: </span>
                <span className="font-semibold">{date}</span>
              </Text>
            )}

            {showStandalonePayment && (
              <>
                <Hr className={rule} />

                <Heading as="h2" className={sectionHeading}>
                  {stage === "awaiting-payment" ? "What you’ll pay" : "Your payment"}
                </Heading>
                <Section>
                  <PaymentRows
                    stage={stage}
                    amountPaidCents={amountPaidCents}
                    balanceDueCents={balanceDueCents}
                    depositDueCents={depositDueCents}
                  />
                </Section>
              </>
            )}

            <Hr className={rule} />

            <Heading as="h2" className={sectionHeading}>
              What happens next
            </Heading>
            <Text className={text}>
              {whatHappensNext({
                stage,
                balanceDueCents,
                depositDueCents,
                deadline,
                rebookUrl,
              })}
            </Text>

            {stage === "awaiting-payment" && bookingUrl && (
              <Section className="mt-6 mb-2">
                <Button className={primaryButton} href={bookingUrl}>
                  Pay deposit
                </Button>
              </Section>
            )}

            {isCancelled && rebookUrl && (
              <Section className="mt-6 mb-2">
                <Button className={primaryButton} href={rebookUrl}>
                  Book again
                </Button>
              </Section>
            )}

            <Section
              className={
                stage === "awaiting-payment" || isCancelled ? "mb-2" : "mt-6 mb-2"
              }
            >
              <Button className={whatsappButton} href={WHATSAPP_HREF}>
                Message us on WhatsApp
              </Button>
            </Section>

            {/* Awaiting payment already links here through "Pay deposit"; a
                released booking has nothing left to view. */}
            {bookingUrl && (stage === "request" || stage === "confirmed") && (
              <Section className="mb-2">
                <Button className={secondaryButton} href={bookingUrl}>
                  {isDayUse && stage === "request" ? "View request status" : "View your booking"}
                </Button>
              </Section>
            )}

            <Text className={`${text} mt-8`}>
              Cheers,
              <br />
              The Fins Team
            </Text>

            <Hr className={rule} />

            <Text className={muted}>
              {brand} · Sokhna, Red Sea
              <br />
              <Link
                href={LOCATION_ADDRESS}
                className="text-[#5B6B7C] underline"
              >
                Find us on the map
              </Link>
              {" · "}
              <Link href={WHATSAPP_HREF} className="text-[#5B6B7C] underline">
                {WHATSAPP_PHONE}
              </Link>
            </Text>
            <Text className={`${muted} mt-2`}>
              You&rsquo;re receiving this because a booking was made with this
              email address. If that wasn&rsquo;t you, message us on WhatsApp
              and we&rsquo;ll cancel it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

/**
 * Full sample data for the previews in ./previews - one per stage. Without it,
 * `npm run email` renders the all-undefined state, which is how the "Hello ,"
 * and wrong-fallback-price bugs survived as long as they did.
 */
export const bookingEmailPreviewBase = {
  username: "Ahmed",
  date: "Saturday, 5 September",
  bookingType: "day-use",
  numberOfPeople: 2,
  numberOfKids: 1,
  priceBreakdown: {
    adultUnitCents: 160000,
    kidsUnitCents: 80000,
    adultTotalCents: 320000,
    kidsTotalCents: 80000,
    totalCents: 400000,
    rateType: "peak",
  },
  bookingUrl: "https://www.finskitesurfing.com/bookings/preview",
} satisfies BookingEmailProps;

BookingEmail.PreviewProps = {
  ...bookingEmailPreviewBase,
  stage: "request",
} satisfies BookingEmailProps;

export default BookingEmail;
