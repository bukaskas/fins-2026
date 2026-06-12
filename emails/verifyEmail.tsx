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

interface VerifyEmailProps {
  username?: string;
  verifyUrl: string;
}

function VerifyEmail({ username, verifyUrl }: VerifyEmailProps) {
  const greetingName = username ? `, ${username}` : "";

  return (
    <Html>
      <Head />
      <Preview>Verify your Fins kitesurfing email</Preview>
      <Tailwind>
        <Body className=" m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              Verify your email
            </Heading>

            <Text className="text-start text-sm leading-relaxed">
              Welcome{greetingName}! Please confirm that this is your email
              address so we can keep your bookings and account secure. This link
              expires in 24 hours.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href={verifyUrl}
              >
                Verify email
              </Button>
            </Section>

            <Text className="text-start text-sm leading-relaxed">
              If the button doesn&apos;t work, copy and paste this link into your
              browser:
            </Text>
            <Text className="text-start text-xs break-all text-blue-600">
              {verifyUrl}
            </Text>

            <Text className="text-start text-sm leading-relaxed mt-6">
              If you didn&apos;t create an account, you can safely ignore this
              email.
            </Text>

            <Text className="text-start text-sm">
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

VerifyEmail.PreviewProps = {
  username: "Alex",
  verifyUrl: "https://www.finskitesurfing.com/verify-email?token=preview",
} as VerifyEmailProps;

export default VerifyEmail;
