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

interface PasswordResetEmailProps {
  username?: string;
  resetUrl: string;
}

function PasswordResetEmail({ username, resetUrl }: PasswordResetEmailProps) {
  const greetingName = username ? `, ${username}` : "";

  return (
    <Html>
      <Head />
      <Preview>Reset your Fins kitesurfing password</Preview>
      <Tailwind>
        <Body className=" m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              Reset your password
            </Heading>

            <Text className="text-start text-sm leading-relaxed">
              Hi{greetingName}, we received a request to reset the password for
              your account. Click the button below to choose a new one. This
              link expires in 1 hour and can be used only once.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href={resetUrl}
              >
                Reset password
              </Button>
            </Section>

            <Text className="text-start text-sm leading-relaxed">
              If the button doesn&apos;t work, copy and paste this link into your
              browser:
            </Text>
            <Text className="text-start text-xs break-all text-blue-600">
              {resetUrl}
            </Text>

            <Text className="text-start text-sm leading-relaxed mt-6">
              If you didn&apos;t request a password reset, you can safely ignore
              this email — your password won&apos;t change.
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

PasswordResetEmail.PreviewProps = {
  username: "Alex",
  resetUrl: "https://www.finskitesurfing.com/reset-password?token=preview",
} as PasswordResetEmailProps;

export default PasswordResetEmail;
