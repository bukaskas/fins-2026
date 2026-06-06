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
  const isKitesurfingCourse = service === "kitesurfing-course";
  const showTickets = isDayUse || isPharaoh;
  const fmt = (cents: number) => `${(cents / 100).toLocaleString("en-EG")} EGP`;

  const waPhone = customerPhone.replace(/[^\d+]/g, "");
  const bookingsLink = `https://www.finskitesurfing.com/bookings?q=${customerPhone.replace(/\D/g, "")}`;
  const waMessage = isDayUse
    ? encodeURIComponent(
        `Hi! We've received your day-use request at Fins 🌊 As a small community space, we like to get to know our guests before confirming. Could you share the Instagram accounts of everyone in your group? If any profiles are private, a quick screenshot works just fine. Once we've had a look, we'll send over your confirmation. Thanks! 🤍`
      )
    : encodeURIComponent(
        `Hello,\nThank you for booking with Fins Kitesurfing & Beach Club! We're excited to have you with us.\nTo complete your first booking, could you please share your Instagram account?\nYou can track the status of your booking anytime here: ${bookingsLink}\nLooking forward to seeing you on the water! 🪁\nThe Fins Team`
      );
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`;
  const scheduleLink = "https://www.finskitesurfing.com/bookings/schedule";

  return (
    <Html>
      <Head />
      <Preview>
        {isKitesurfingCourse
          ? `Kitesurf booking at ${date}`
          : `New booking: ${customerName} — ${service} on ${date}`}
      </Preview>
      <Tailwind>
        <Body className="m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              {isKitesurfingCourse ? "Kitesurfing Course" : "New Booking Received"}
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
            {isKitesurfingCourse && (
              <Section className="text-center mt-3">
                <Button
                  href={scheduleLink}
                  className="py-2.5 px-5 bg-blue-600 rounded-md text-white text-sm font-semibold no-underline text-center"
                >
                  View Schedule
                </Button>
              </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StaffNotificationEmail;
