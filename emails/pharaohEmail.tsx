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

interface PharaohAirstyleEmailProps {
  username?: string;
}

const PharaohAirstyleEmail = ({ username }: PharaohAirstyleEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Thank you for reserving your spot at the Pharaoh Airstyle Event!</Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              Pharaoh Airstyle Event 🎉
            </Heading>

            <Text className="text-sm">Hi {username},</Text>
            <Text className="text-sm leading-relaxed">
              Thank you for reserving your spot at the Pharaoh Airstyle Event 🎉
            </Text>
            <Text className="text-sm leading-relaxed">
              Our staff will contact you regards confirmation procedure.
            </Text>
            <Text className="text-sm">You can contact us here</Text>

            <Section className="text-center mt-[24px] mb-[24px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href="https://wa.me/201080500099?text=Hello%2C%20I%20have%20reserved%20a%20spot%20at%20the%20Pharaoh%20Airstyle%20Event"
              >
                Contact Fins Team on WhatsApp
              </Button>
            </Section>

            <Hr className="my-4 border-gray-200" />

            <Text className="text-sm font-semibold mb-1">📅 EVENT HIGHLIGHTS</Text>
            <Text className="text-sm leading-relaxed">
              🪁 Airstyle Kitesurfing Competition{"\n"}
              🧘 SUKUN Pop-Up Classes – SUP Yoga • Vinyasa Flow • Glow Yoga • Headphone Yoga{"\n"}
              🎈 Kids Entertainment by Il Campo{"\n"}
              🎵 DJ &amp; Live Music by the Beach{"\n"}
              🍽️ Food Pass Arounds
            </Text>

            <Hr className="my-4 border-gray-200" />

            <Text className="text-sm font-semibold mb-1">🗓️ EVENT SCHEDULE</Text>
            <Text className="text-sm leading-relaxed">
              10:00 AM — Skippers Meeting + SUKUN Class{"\n"}
              11:00 AM – 1:00 PM — Airstyle Competition Round 1{"\n"}
              1:00 – 3:00 PM — Airstyle Competition Round 2 + Kids Entertainment + Food Pass Arounds{"\n"}
              2:00 – 3:00 PM — Semi Finals{"\n"}
              3:00 – 4:00 PM — Kite Show + SUKUN Class + Food Pass Arounds{"\n"}
              4:00 – 5:00 PM — Finals{"\n"}
              6:00 PM onwards — Prize Giving &amp; Anniversary Celebration 🏆{"\n\n"}
              Background music all day long! 🎶
            </Text>

            <Hr className="my-4 border-gray-200" />

            <Text className="text-sm leading-relaxed">
              If you have any questions about your reservation or the event, just reply to this email — we&apos;re happy to help.
            </Text>
            <Text className="text-sm">See you on the beach! 🌊☀️</Text>
            <Text className="text-sm">
              Warm regards,{"\n"}
              The Fins Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PharaohAirstyleEmail;
