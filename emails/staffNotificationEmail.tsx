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

interface StaffNotificationEmailProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  service: string;
  numberOfPeople: number;
  numberOfKids?: number;
  totalPriceCents?: number;
}

const StaffNotificationEmail = ({
  customerName,
  customerEmail,
  customerPhone,
  date,
  service,
  numberOfPeople,
  numberOfKids,
  totalPriceCents,
}: StaffNotificationEmailProps) => {
  const isDayUse = service === "day-use";
  const isPharaoh = service === "pharaoh-airstyle";
  const showTickets = isDayUse || isPharaoh;
  const fmt = (cents: number) => `${(cents / 100).toLocaleString("en-EG")} EGP`;

  const waPhone = customerPhone.replace(/[^\d+]/g, "");
  const waMessage = isDayUse
    ? encodeURIComponent(
        `Hi ${customerName}, thank you for booking your day use at Fins! 🌊\nWe'd love to get to know you a little before your visit. Could you share your Instagram or social media account? If it's private, a screenshot works just fine. See you soon! 🤍`
      )
    : encodeURIComponent(`Hi ${customerName}, this is Fins regarding your booking.`);
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`;
  const bookingsLink = `https://www.finskitesurfing.com/bookings?q=${customerPhone.replace(/\D/g, "")}`;

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
              {showTickets ? (
                <>
                  <Text className="text-sm m-0"><strong>Adults:</strong> {numberOfPeople}</Text>
                  <Text className="text-sm m-0"><strong>Kids:</strong> {numberOfKids ?? 0}</Text>
                  {totalPriceCents != null && (
                    <Text className="text-sm m-0"><strong>Total price:</strong> {fmt(totalPriceCents)}</Text>
                  )}
                </>
              ) : (
                <Text className="text-sm m-0"><strong>Number of people:</strong> {numberOfPeople}</Text>
              )}
            </Section>
            <Section className="text-center mt-6">
              <Button
                href={waLink}
                className="py-2.5 px-5 bg-green-500 rounded-md text-black text-sm font-semibold no-underline text-center"
              >
                Reply on WhatsApp
              </Button>
            </Section>
            <Section className="text-center mt-3">
              <Button
                href={bookingsLink}
                className="py-2.5 px-5 bg-orange-500 rounded-md text-white text-sm font-semibold no-underline text-center"
              >
                View All Bookings
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StaffNotificationEmail;
