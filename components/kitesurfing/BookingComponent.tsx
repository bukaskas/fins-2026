import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { Booking } from "@prisma/client";
import { Calendar1, Clock10, Phone, School, User } from "lucide-react";
import { Button } from "../ui/button";
function BookingComponent({ booking }: { booking: Booking }) {
  const dateObj = new Date(booking.date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1; // Months are zero-indexed
  // Create edit page for booking with route /bookings/[id]/edit and link to it from the edit button in the booking component. The edit page should have a form pre-filled with the booking data and allow updating the booking details. Use server actions to handle the form submission and update the booking in the database.
  // Group the bookings by instructor and date

  return (
    <Card className="mx-4">
      <CardContent className="flex gap-4 justify-between">
        <div className="flex gap-2">
          <Calendar1 />
          {day}-{month}
        </div>
        <div className="flex gap-2">{booking.time}</div>
        <div className="flex gap-2">{booking.name}</div>
        <div className="flex gap-2">{booking.phone}</div>
        <div className="flex gap-2">{booking.service}</div>
        <Button variant="outline" size="sm">
          <Link href={`/bookings/${booking.id}/edit`}> Edit</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default BookingComponent;
