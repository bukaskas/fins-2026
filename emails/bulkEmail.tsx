import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BulkEmailProps {
  username?: string;
  message: string;
}

const BulkEmail = ({ username, message }: BulkEmailProps) => {
  const lines = (message ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const previewText = lines[0] ?? "A message from the Fins team";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Text className="text-start text-sm">
              Hello{username ? ` ${username}` : ""},
            </Text>
            {lines.map((line, i) => (
              <Text key={i} className="text-start text-sm leading-relaxed">
                {line}
              </Text>
            ))}
            <Section className="text-center mt-[32px] mb-[16px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href="https://wa.me/201222144388"
              >
                Contact us on WhatsApp
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

export default BulkEmail;
