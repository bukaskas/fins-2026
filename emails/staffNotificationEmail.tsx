import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface StaffNotificationEmailProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  service: string;
  numberOfPeople: number;
}

const StaffNotificationEmail = ({
  customerName,
  customerEmail,
  customerPhone,
  date,
  service,
  numberOfPeople,
}: StaffNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New booking: {customerName} — {service} on {date}</Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              New Booking Received
            </Heading>
            <Section className="bg-gray-50 rounded-lg p-4">
              <Text className="text-sm m-0"><strong>Customer:</strong> {customerName}</Text>
              <Text className="text-sm m-0"><strong>Email:</strong> {customerEmail}</Text>
              <Text className="text-sm m-0"><strong>Phone:</strong> {customerPhone}</Text>
              <Text className="text-sm m-0"><strong>Service:</strong> {service}</Text>
              <Text className="text-sm m-0"><strong>Date:</strong> {date}</Text>
              <Text className="text-sm m-0"><strong>Number of people:</strong> {numberOfPeople}</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StaffNotificationEmail;
