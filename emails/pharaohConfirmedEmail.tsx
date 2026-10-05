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
import { formatEGP } from "@/lib/pricing";
import { LOCATION_ADDRESS, WHATSAPP_PHONE, PHARAOH_EVENT_HOURS } from "@/lib/constants";

// Same derivation the site footer uses: local Egyptian number -> wa.me form.
const WHATSAPP_HREF = `https://wa.me/20${WHATSAPP_PHONE.substring(1)}`;

/* Confirmed-booking email for the Pharaoh Airstyle day. Sent in place of the
   generic day-use confirmation for any confirmed booking on the event date —
   public spectators once they've paid, and Kai community registrations, which
   are confirmed on insert and never pay. Same visual language as
   emailTemplate.tsx. */

const SCHEDULE: { time: string; what: string }[] = [
  { time: "9:30 AM", what: "Skippers meeting" },
  { time: "10:00 AM – 1:00 PM", what: "Rider heats" },
  { time: "1:00 – 2:00 PM", what: "Lunch break" },
  { time: "2:00 PM", what: "Kids activities" },
  { time: "3:30 – 5:30 PM", what: "Kite Hopper" },
  { time: "5:30 PM", what: "Sunset kite show" },
  { time: "7:00 PM", what: "After party" },
];

interface PharaohConfirmedEmailProps {
  username?: string;
  /** Display-formatted date, e.g. "Friday, 9 October". */
  date?: string;
  numberOfPeople?: number;
  numberOfKids?: number;
  bookingUrl?: string;
  amountPaidCents?: number;
  balanceDueCents?: number;
}

const text = "text-[15px] leading-relaxed text-[#22303F] m-0";
const muted = "text-[13px] leading-relaxed text-[#5B6B7C] m-0";
const sectionHeading =
  "text-[17px] font-semibold text-[#22303F] mt-0 mb-2 mx-0 p-0";
const rule = "my-6 border-[#D6E0EA]";

function describeParty(adults: number, kids: number): string | null {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adult" : "adults"}`);
  if (kids > 0) parts.push(`${kids} ${kids === 1 ? "child" : "children"}`);
  return parts.length ? parts.join(" · ") : null;
}

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <Text className={`${text} mb-1`}>
    <span className="text-[#5B6B7C]">{label}: </span>
    <span className="font-semibold">{value}</span>
  </Text>
);

const PharaohConfirmedEmail = ({
  username,
  date,
  numberOfPeople,
  numberOfKids,
  bookingUrl,
  amountPaidCents,
  balanceDueCents,
}: PharaohConfirmedEmailProps) => {
  const party = describeParty(numberOfPeople ?? 0, numberOfKids ?? 0);
  // A free registration (Kai community) has nothing to report: a "Paid 0 EGP"
  // row would read as though we forgot to charge.
  const hasPayment = (amountPaidCents ?? 0) > 0 || (balanceDueCents ?? 0) > 0;
  const balanceDue = (balanceDueCents ?? 0) > 0 ? balanceDueCents! : 0;

  const previewText = [date, party, "Schedule inside", "See you on the beach"]
    .filter(Boolean)
    .join(" · ");

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font fontFamily="Raleway" fallbackFontFamily={["Arial", "sans-serif"]} />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
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
            <Text className="text-[12px] font-bold uppercase tracking-[2px] text-[#0369a1] m-0 mb-2">
              Pharaoh Airstyle
            </Text>
            <Heading className="text-[26px] font-semibold leading-tight text-[#22303F] text-start p-0 mt-0 mb-6 mx-0">
              You&rsquo;re confirmed for Pharaoh Airstyle
            </Heading>

            <Text className={`${text} mb-4`}>
              Hello{username ? " " : ""}
              {username ? <bdi>{username}</bdi> : null},
            </Text>
            <Text className={text}>
              Your spot is confirmed. Join us for a day packed with activities,
              music, flavorful bites, and high-flying kitesurfing tricks. The
              full schedule is below.
            </Text>

            {bookingUrl && (
              <Section className="mt-6 mb-2">
                <Button
                  className="inline-block rounded-[8px] bg-[#38bdf8] px-6 py-3.5 text-[15px] font-semibold text-[#0c1a2e] no-underline text-center"
                  href={bookingUrl}
                >
                  View your confirmed booking
                </Button>
              </Section>
            )}
            <Text className={`${muted} mt-2`}>
              Show your booking page at the gate on arrival.
            </Text>

            <Hr className={rule} />

            <Heading as="h2" className={sectionHeading}>
              Your booking
            </Heading>
            {date && <MetaRow label="Date" value={date} />}
            {party && <MetaRow label="Guests" value={party} />}
            <MetaRow label="Hours" value={PHARAOH_EVENT_HOURS} />
            {hasPayment && (
              <>
                {amountPaidCents !== undefined && amountPaidCents > 0 && (
                  <MetaRow label="Paid" value={formatEGP(amountPaidCents)} />
                )}
                <MetaRow
                  label={balanceDue > 0 ? "Due on arrival" : "Balance"}
                  value={balanceDue > 0 ? formatEGP(balanceDue) : "Nothing left to pay"}
                />
              </>
            )}

            <Hr className={rule} />

            <Heading as="h2" className={sectionHeading}>
              Schedule
            </Heading>
            <Section>
              {SCHEDULE.map((item, i) => (
                <Row key={item.what}>
                  <Column
                    style={{ borderTop: i === 0 ? undefined : "1px solid #EEF2F6" }}
                    className="w-[150px] py-2 pr-3 align-top text-[14px] font-semibold text-[#0369a1] whitespace-nowrap"
                  >
                    {item.time}
                  </Column>
                  <Column
                    style={{ borderTop: i === 0 ? undefined : "1px solid #EEF2F6" }}
                    className="py-2 align-top text-[15px] text-[#22303F]"
                  >
                    {item.what}
                  </Column>
                </Row>
              ))}
            </Section>
            <Text className={`${muted} mt-3`}>
              Times on the water depend on the wind and may shift on the day.
            </Text>

            <Hr className={rule} />

            <Heading as="h2" className={sectionHeading}>
              Please leave at home
            </Heading>
            <Text className={text}>Pets</Text>
            <Text className={text}>Cooler boxes</Text>
            <Text className={text}>Speakers</Text>
            <Text className={text}>Outside food and drinks</Text>

            <Hr className={rule} />

            <Text className={text}>
              If anything changes, message us on WhatsApp and we&rsquo;ll sort
              it out.
            </Text>
            <Section className="mt-4 mb-2">
              <Button
                className="inline-block rounded-[8px] bg-green-500 px-6 py-3.5 text-[15px] font-semibold text-black no-underline text-center"
                href={WHATSAPP_HREF}
              >
                Message us on WhatsApp
              </Button>
            </Section>

            <Text className={`${text} mt-8`}>
              See you on the beach,
              <br />
              The Fins Team
            </Text>

            <Hr className={rule} />

            <Text className={muted}>
              Fins Kitesurfing Center · Sokhna, Red Sea
              <br />
              <Link href={LOCATION_ADDRESS} className="text-[#5B6B7C] underline">
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

PharaohConfirmedEmail.PreviewProps = {
  username: "Ahmed",
  date: "Friday, 9 October",
  numberOfPeople: 2,
  numberOfKids: 1,
  bookingUrl: "https://www.finskitesurfing.com/bookings/preview",
  amountPaidCents: 0,
  balanceDueCents: 0,
} satisfies PharaohConfirmedEmailProps;

export default PharaohConfirmedEmail;
