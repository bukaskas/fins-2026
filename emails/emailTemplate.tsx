import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BookingEmailProps {
  username?: string;
  date?: string;
  bookingType?: string;
  numberOfPeople?: number;
  numberOfKids?: number;
  totalPriceCents?: number;
}

const serviceContent: Record<
  string,
  { heading: string; body: string; cta: string }
> = {
  "kitesurfing-course": {
    heading: "Your kitesurfing booking is confirmed!",
    body: "We are excited to welcome you on {date}. We will follow the forecast and update you with the exact time a day before, because the weather can be difficult to predict. Please let us know if you have a preferred time.",
    cta: "Contact us on WhatsApp",
  },
  "day-use": {
    heading: "Your beach day is booked! 🌊",
    body: "We can't wait to host you on {date}.",
    cta: "Contact us on WhatsApp",
  },
  restaurant: {
    heading: "Your restaurant reservation is confirmed!",
    body: "We look forward to welcoming you on {date}. Our team will make sure you have a wonderful dining experience. Please don't hesitate to contact us if you have any dietary requirements or special requests.",
    cta: "Contact us on WhatsApp",
  },
  "pharaoh-airstyle": {
    heading: "Your Pharaoh Airstyle booking is confirmed!",
    body: "We are excited to welcome you on {date}. Get ready for an unforgettable experience at the Pharaoh Airstyle event and celebration of 4 years of Fins. A full day of activities and entertainment awaits you. Sukun will offer yoga and wellness sessions, while Il Campo will host beach activities for both children and adults. There will also be music throughout the day to keep the energy high. If you have any questions or special requests, feel free to reach out.",
    cta: "Contact us on WhatsApp",
  },
};

const defaultContent = serviceContent["kitesurfing-course"];

interface DayUseDetailsProps {
  numberOfPeople?: number;
  numberOfKids?: number;
  totalPriceCents?: number;
}

const DayUseDetails = ({ numberOfPeople, numberOfKids, totalPriceCents }: DayUseDetailsProps) => {
  const hasBreakdown =
    totalPriceCents != null &&
    numberOfPeople != null &&
    numberOfPeople > 0;

  const adultPrice = 120000;
  const kidsPrice = 60000;
  const adults = numberOfPeople ?? 0;
  const kids = numberOfKids ?? 0;
  const total = totalPriceCents ?? 0;

  const fmt = (cents: number) => `${(cents / 100).toLocaleString("en-EG")} EGP`;

  return (
  <>
    <Hr className="my-4 border-gray-200" />

    {hasBreakdown ? (
      <>
        <Text className="text-sm font-semibold mb-1">💰 Price breakdown:</Text>
        {adults > 0 && (
          <Text className="text-sm m-0">
            Adults: {adults} × {fmt(adultPrice)} = {fmt(adults * adultPrice)}
          </Text>
        )}
        {kids > 0 && (
          <Text className="text-sm m-0">
            Kids: {kids} × {fmt(kidsPrice)} = {fmt(kids * kidsPrice)}
          </Text>
        )}
        <Text className="text-sm font-semibold mt-1">
          Total: {fmt(total)}
        </Text>
      </>
    ) : (
      <Text className="text-sm font-semibold mb-1">💰 1,200 LE / per person</Text>
    )}
    <Text className="text-sm mb-0">⏰ 9:00 AM – 11:00 PM</Text>

    <Hr className="my-4 border-gray-200" />

    <Text className="text-sm font-semibold mb-1">✅ Includes:</Text>
    <Text className="text-sm leading-relaxed">
      • Beach entrance{"\n"}• Swimming pool{"\n"}• Showers &amp; lounges{"\n"}•
      Lockers (no rooms available)
    </Text>

    <Hr className="my-4 border-gray-200" />

    <Text className="text-sm font-semibold mb-1">🚫 House Rules:</Text>
    <Text className="text-sm leading-relaxed">
      • No pets{"\n"}• No icebox{"\n"}• No speakers{"\n"}• No outside food or
      drinks{"\n"}• Mixed groups &amp; families only
    </Text>

    <Hr className="my-4 border-gray-200" />

    <Text className="text-sm text-gray-500 italic leading-relaxed">
      Our team will be in touch with you shortly to confirm your booking. As
      part of our process, we may ask you to share your social media account so
      we can get to know you. If your account is private, a screenshot works
      just fine. This helps us keep our community the way we love it 🤍
    </Text>
  </>
  );
};

const BookingEmail = ({ username, date, bookingType, numberOfPeople, numberOfKids, totalPriceCents }: BookingEmailProps) => {
  const content =
    (bookingType ? serviceContent[bookingType] : null) ?? defaultContent;
  const body = content.body.replace("{date}", date ?? "your scheduled date");
  const previewText = `${content.heading} — ${username}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              {content.heading}
            </Heading>
            <Text className="text-start text-sm">Hello {username},</Text>
            <Text className="text-start text-sm leading-relaxed">{body}</Text>
            {bookingType === "day-use" && (
              <DayUseDetails
                numberOfPeople={numberOfPeople}
                numberOfKids={numberOfKids}
                totalPriceCents={totalPriceCents}
              />
            )}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href={`https://wa.me/201080500099?text=Hello%2C%0AI%20did%20reserve%20a%20spot.%20I%20have%20few%20questions`}
              >
                {content.cta}
              </Button>
            </Section>
            <Text className="text-start text-sm text-white">
              Cheers,
              <br />
              The Fins Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingEmail;
