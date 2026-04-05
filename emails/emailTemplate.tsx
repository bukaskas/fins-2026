import {
  Body,
  Button,
  Container,
  Head,
  Heading,
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
    heading: "Your beach day is booked!",
    body: "We can't wait to host you on {date}. Get ready to relax and enjoy the beach, sun, and sea at Fins. If you have any questions or special requests, feel free to reach out.",
    cta: "Contact us on WhatsApp",
  },
  restaurant: {
    heading: "Your restaurant reservation is confirmed!",
    body: "We look forward to welcoming you on {date}. Our team will make sure you have a wonderful dining experience. Please don't hesitate to contact us if you have any dietary requirements or special requests.",
    cta: "Contact us on WhatsApp",
  },
};

const defaultContent = serviceContent["kitesurfing-course"];

const BookingEmail = ({ username, date, bookingType }: BookingEmailProps) => {
  const content = (bookingType ? serviceContent[bookingType] : null) ?? defaultContent;
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
