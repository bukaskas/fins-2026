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
import { formatEGP, type PriceBreakdown, type RateType } from "@/lib/pricing";
import { LOCATION_ADDRESS, WHATSAPP_PHONE } from "@/lib/constants";

// Same derivation the site footer uses: local Egyptian number -> wa.me form.
const WHATSAPP_HREF = `https://wa.me/20${WHATSAPP_PHONE.substring(1)}`;

interface BookingEmailProps {
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
  /**
   * Most bookings reach this template as PENDING (see createBooking), so the
   * default wording is a receipt, not a confirmation. Callers that really do
   * hold a seat - the lesson flow - opt into the confirmed wording.
   */
  confirmed?: boolean;
}

interface ServiceCopy {
  requestHeading: string;
  confirmedHeading: string;
  body: string;
}

const serviceContent: Record<string, ServiceCopy> = {
  "kitesurfing-course": {
    requestHeading: "We've received your kitesurfing request",
    confirmedHeading: "Your kitesurfing session is booked",
    body: "Thanks for booking with us. We'll be watching the forecast and will send you the exact time the day before — the wind here is hard to call any earlier than that. If there's a time you'd prefer, tell us and we'll try to build the day around it.",
  },
  "day-use": {
    requestHeading: "We've received your day-use request",
    confirmedHeading: "Your day-use booking is confirmed",
    body: "Thanks for reaching out! Everything you asked for is below, so you can check it before we speak.",
  },
  restaurant: {
    requestHeading: "We've received your table request",
    confirmedHeading: "Your table is booked",
    body: "Thanks for choosing us. If you have any dietary requirements or you're celebrating something, tell us now and we'll have it ready before you sit down.",
  },
};

// Any service without its own copy gets wording that is true for all of them,
// rather than silently inheriting the kitesurfing text.
const fallbackContent: ServiceCopy = {
  requestHeading: "We've received your booking request",
  confirmedHeading: "Your booking is confirmed",
  body: "Thanks for booking with us. Everything you asked for is below.",
};

const rateLabel: Record<RateType, string> = {
  standard: "Standard rate",
  holiday: "Holiday rate",
  discounted: "Discounted rate",
};

const text = "text-[15px] leading-relaxed text-[#22303F] m-0";
const muted = "text-[13px] leading-relaxed text-[#5B6B7C] m-0";
const sectionHeading =
  "text-[17px] font-semibold text-[#22303F] mt-0 mb-2 mx-0 p-0";
const rule = "my-6 border-[#D6E0EA]";

/** "2 adults · 1 child (5-8)", skipping whatever isn't there. */
function describeParty(adults: number, kids: number): string | null {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adult" : "adults"}`);
  if (kids > 0) parts.push(`${kids} ${kids === 1 ? "child" : "children"} (5–8)`);
  return parts.length ? parts.join(" · ") : null;
}

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
}

const DayUseDetails = ({
  date,
  numberOfPeople,
  numberOfKids,
  priceBreakdown,
}: DayUseDetailsProps) => {
  const adults = numberOfPeople ?? 0;
  const kids = numberOfKids ?? 0;
  const party = describeParty(adults, kids);

  return (
    <>
      <Hr className={rule} />

      <Heading as="h2" className={sectionHeading}>
        Your request
      </Heading>

      {/* Label and value share one paragraph rather than two table cells:
          adjacent cells collapse into "DateSaturday" once a client renders
          the plain-text alternative. */}
      {date && <MetaRow label="Date" value={date} />}
      {party && <MetaRow label="Guests" value={party} />}
      <MetaRow label="Hours" value="9:00 AM – 11:00 PM" />

      {/* Prices are rendered only when the booking was actually priced. An
          invented per-person figure was wrong on holiday, discounted and
          child rates alike, so nothing is better than a guess here. */}
      {priceBreakdown && (
        <>
          <Hr className={rule} />

          <Heading as="h2" className={sectionHeading}>
            What you&rsquo;ll pay
          </Heading>
          <Text className={`${muted} mb-3`}>
            {rateLabel[priceBreakdown.rateType]} for this date.
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
                  {"\u00A0"}
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
                  {"\u00A0"}
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
                {"\u00A0"}
                {formatEGP(priceBreakdown.totalCents)}
              </Column>
            </Row>
          </Section>

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

      <Section className="mt-5 rounded-[8px] bg-[#F2F6FA] px-4 py-3">
        <Text className="text-[15px] leading-relaxed text-[#22303F] font-semibold m-0">
          Mixed groups and families only
        </Text>
        <Text className={`${muted} mt-1`}>
          This one decides entry at the gate, so please check it before you
          travel.
        </Text>
      </Section>
    </>
  );
};

const BookingEmail = ({
  username,
  date,
  bookingType,
  numberOfPeople,
  numberOfKids,
  priceBreakdown,
  bookingUrl,
  confirmed = false,
}: BookingEmailProps) => {
  const mapped = bookingType ? serviceContent[bookingType] : undefined;
  if (bookingType && !mapped) {
    // Surface the gap instead of sending a guest the wrong service's email.
    console.error(
      `[emailTemplate] No copy for bookingType "${bookingType}" — sent the service-agnostic version.`,
    );
  }
  const content = mapped ?? fallbackContent;
  const heading = confirmed ? content.confirmedHeading : content.requestHeading;

  const isDayUse = bookingType === "day-use";
  const party = describeParty(numberOfPeople ?? 0, numberOfKids ?? 0);

  // The inbox row is the second-most-read line in an email; spend it on the
  // facts the subject can't carry rather than repeating the heading.
  const previewText = [
    date,
    isDayUse ? party : null,
    isDayUse && priceBreakdown ? formatEGP(priceBreakdown.totalCents) : null,
    confirmed ? "See you on the beach" : "We'll confirm on WhatsApp",
  ]
    .filter(Boolean)
    .join(" · ");

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
              {heading}
            </Heading>

            <Text className={`${text} mb-4`}>
              Hello{username ? " " : ""}
              {/* Isolate the name so an Arabic name doesn't drag the comma
                  to the wrong side of the line. */}
              {username ? <bdi>{username}</bdi> : null},
            </Text>
            <Text className={text}>{content.body}</Text>

            {isDayUse && (
              <DayUseDetails
                date={date}
                numberOfPeople={numberOfPeople}
                numberOfKids={numberOfKids}
                priceBreakdown={priceBreakdown}
              />
            )}

            {!isDayUse && date && (
              <Text className={`${text} mt-4`}>
                <span className="text-[#5B6B7C]">Date: </span>
                <span className="font-semibold">{date}</span>
              </Text>
            )}

            <Hr className={rule} />

            <Heading as="h2" className={sectionHeading}>
              What happens next
            </Heading>
            <Text className={text}>
              {confirmed
                ? "You're on the list. If anything changes, message us on WhatsApp and we'll sort it out."
                : "Our team reviews every request by hand and will reply on WhatsApp to confirm your spot. If you need to change anything — the date, the number of people — just tell us in that chat."}
            </Text>

            <Section className="mt-6 mb-2">
              <Button
                className="inline-block rounded-[8px] bg-green-500 px-6 py-3.5 text-[15px] font-semibold text-black no-underline text-center"
                href={WHATSAPP_HREF}
              >
                Message us on WhatsApp
              </Button>
            </Section>

            {bookingUrl && (
              <Section className="mb-2">
                <Button
                  className="inline-block rounded-[8px] border border-solid border-[#5B6B7C] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#22303F] no-underline text-center"
                  href={bookingUrl}
                >
                  {isDayUse ? "View request status" : "View your booking"}
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
              Fins Kitesurfing Center · Sokhna, Red Sea
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

// Without this, `npm run email` renders the all-undefined state, which is how
// the "Hello ," and wrong-fallback-price bugs survived this long.
BookingEmail.PreviewProps = {
  username: "Ahmed",
  date: "Saturday, 5 September",
  bookingType: "day-use",
  numberOfPeople: 2,
  numberOfKids: 1,
  priceBreakdown: {
    adultUnitCents: 160000,
    kidsUnitCents: 70000,
    adultTotalCents: 320000,
    kidsTotalCents: 70000,
    totalCents: 390000,
    rateType: "holiday",
  },
  bookingUrl: "https://www.finskitesurfing.com/bookings/preview",
} satisfies BookingEmailProps;

export default BookingEmail;
