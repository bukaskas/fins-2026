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

async function DayUseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; date?: string; type?: string }>;
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
              <Link href="/day-use/booking">Back to Booking</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const formattedDate = `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking received!</CardTitle>
          <CardDescription>
            Your spot on <strong>{formattedDate}</strong> has been requested.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Booking reference */}
          <div className="rounded-lg bg-muted px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Booking ID</span>
            <span className="text-sm font-mono">{bookingId}</span>
          </div>

          {/* What happens next */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">What happens next</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-none">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span>Our team will review your booking and reach out shortly to confirm your spot.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span>We may ask you to share your Instagram or social media account so we can get to know you. If your account is private, a screenshot works fine.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <span>Once confirmed, show up on the day and enjoy! Gates open at <strong>9:00 AM</strong> and close at <strong>11:00 PM</strong>.</span>
              </li>
            </ol>
          </div>

          {/* Includes */}
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <p className="font-semibold">Included with your ticket</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>Beach entrance</li>
              <li>Swimming pool</li>
              <li>Showers &amp; lounges</li>
              <li>Lockers (no rooms available)</li>
            </ul>
          </div>

          {/* House rules */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2 text-sm">
            <p className="font-semibold">House rules</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>No pets, icebox, or speakers</li>
              <li>No outside food or drinks</li>
              <li>Mixed groups &amp; families only</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="https://wa.me/201080500099">Contact Us on WhatsApp</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default DayUseSuccessPage;
