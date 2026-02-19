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

interface RegistrationEmailProps {
  username?: string;
  date?: string;
}

function RegistrationEmail({ username, date }: RegistrationEmailProps) {
  const previewText = `Welcome and thank you ${username}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className=" m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl  font-normal text-center p-0 my-8 mx-0">
              Thank you for signing up, {username}!
            </Heading>

            <Text className="text-start text-sm  leading-relaxed">
              We are creating a database of and will want to improve our
              services based on the feedback. In future you will manage to book
              any services through our website, as well we will seek to help
              inform of any offers and events if you wish to join. For any
              questions feel free to contact us via whatsapp.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href={`https://wa.me/201121105926?text=Hello%2C%20I%20have%20register%20on%20the%20website.%20Let%20me%20know%20more%20info%20about%20it`}
              >
                Contact us on Whatsapp
              </Button>
            </Section>
            <Text className="text-start text-sm text-white">
              Cheers,
              <br />
              The Fins kitesurfing Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default RegistrationEmail;
