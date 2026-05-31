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

interface FullyBookedEmailProps {
  username?: string;
  date?: string;
}

const FullyBookedEmail = ({ username, date }: FullyBookedEmailProps) => {
  const dateLabel = date ?? "the requested date";
  const previewText = `Update on your booking for ${dateLabel}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              We&rsquo;re fully booked on {dateLabel}
            </Heading>
            <Text className="text-start text-sm">Hello{username ? ` ${username}` : ""},</Text>
            <Text className="text-start text-sm leading-relaxed">
              This is Fins Kitesurfing Center. Apologies for the late reply — it&rsquo;s been a
              busy period!
            </Text>
            <Text className="text-start text-sm leading-relaxed">
              Unfortunately, {dateLabel} is fully booked. If you&rsquo;re able to come on a
              different day, we&rsquo;d love to hear from you!
            </Text>
            <Section className="text-center mt-[32px] mb-[16px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href="https://wa.me/201080500099?text=Hello%2C%0AI%27d%20like%20to%20book%20a%20different%20day"
              >
                Pick another day on WhatsApp
              </Button>
            </Section>
            <Text className="text-start text-sm">
              Best regards,
              <br />
              The Fins Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default FullyBookedEmail;
