import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

// http://localhost:3000/kitesurfing/booking/success?bookingId=d4b8218c-a1c4-46ab-ab9e-6b2d2e53151c&date=2026-01-29T15:58:12.494Z
async function SuccessBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.bookingId;
  const date = params.date ? new Date(params.date) : null;

  if (!bookingId || !date) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Booking</CardTitle>
            <CardDescription>
              Missing booking information. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/kitesurfing/booking">Back to Booking</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your kitesurfing experience has been successfully booked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Booking ID:
              </span>
              <span className="text-sm font-mono">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Date:
              </span>
              <span className="text-sm font-semibold">
                {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}
              </span>
            </div>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            We will send you a confirmation email with further details shortly.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/kitesurfing/booking">Book Another Experience</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SuccessBookingPage;
