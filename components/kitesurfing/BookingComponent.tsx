import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { Booking } from "@prisma/client";
import { Users, Pencil } from "lucide-react";
import { Button } from "../ui/button";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-label="WhatsApp"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function BookingComponent({ booking }: { booking: Booking }) {
  const dateObj = new Date(booking.date);
  const day = dateObj.getUTCDate();
  const month = dateObj.getUTCMonth() + 1;

  const waLink = `https://wa.me/${booking.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(booking.name)}%2C%20this%20is%20Fins%20regarding%20your%20booking.`;

  return (
    <Card className="mx-2 sm:mx-4">
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 px-4">
        {/* Date */}
        <span className="text-sm font-semibold tabular-nums w-12 shrink-0">
          {day}/{month}
        </span>

        {/* Time */}
        {booking.time && (
          <span className="text-sm text-muted-foreground shrink-0">
            {booking.time}
          </span>
        )}

        {/* Name */}
        <span className="text-sm font-medium flex-1 min-w-[100px]">
          {booking.name}
        </span>

        {/* People count */}
        <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
          <Users className="h-3.5 w-3.5" />
          {booking.numberOfPeople}
        </span>

        {/* WhatsApp button */}
        <Link
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium shrink-0"
        >
          <WhatsAppIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{booking.phone}</span>
        </Link>

        {/* Edit */}
        <Button variant="outline" size="sm" asChild className="shrink-0 h-7 px-2">
          <Link href={`/bookings/${booking.id}/edit`}>
            <Pencil className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default BookingComponent;
