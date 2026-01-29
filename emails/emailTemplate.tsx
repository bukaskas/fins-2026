import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://fins-2026.vercel.app/"
    : "./static";
interface BookingEmailProps {
  username?: string;
  date?: string;
}

const BookingEmail = ({ username, date }: BookingEmailProps) => {
  const previewText = `Welcome and thank you ${username}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className=" m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl  font-normal text-center p-0 my-8 mx-0">
              Welcome and thank you for your booking {username}!
            </Heading>
            <Text className="text-start text-sm ">Hello {username},</Text>
            <Text className="text-start text-sm  leading-relaxed">
              We're excited to start the course on {date}. We will follow the
              forecast and update you with exact time a day before, because the
              weather can be difficult to predict. Please let us know if you
              have preferred time.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
                href={`https://wa.me/201080500099?text=Hello%2C%0AI%20did%20reserve%20a%20spot.%20I%20have%20few%20questions`}
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
};

export default BookingEmail;
