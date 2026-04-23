import { getBookingCountsByDate } from "@/lib/actions/booking.actions";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";


export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_FILTERS: { label: string; value: string; statuses: BookingStatus[] }[] = [
  { label: "All",       value: "all",       statuses: [] },
  { label: "Confirmed", value: "confirmed", statuses: [BookingStatus.CONFIRMED] },
  { label: "Pending",   value: "pending",   statuses: [BookingStatus.PENDING, BookingStatus.REQUEST_SENT, BookingStatus.UNDER_REVIEW, BookingStatus.WAITING_PAYMENT] },
];

async function BookingsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;

  const activeFilter = STATUS_FILTERS.find((f) => f.value === status) ?? STATUS_FILTERS[0];
  const result = await getBookingCountsByDate(
    activeFilter.statuses.length > 0 ? activeFilter.statuses : undefined
  );

  const counts = result.success
    ? (result.data as {
        date: string;
        totalPeople: number;
        bookingCount: number;
      }[])
    : [];

  const now = new Date();
  const thisMonth = format(now, "yyyy-MM");

  const thisMonthCounts = counts.filter((c) => c.date.startsWith(thisMonth));
  const totalBookingsThisMonth = thisMonthCounts.reduce(
    (s, c) => s + c.bookingCount,
    0,
  );
  const totalPeopleThisMonth = thisMonthCounts.reduce(
    (s, c) => s + c.totalPeople,
    0,
  );

  const today = format(now, "yyyy-MM-dd");
  const futureCounts = counts.filter((c) => c.date >= today);
  const busiestDay = futureCounts.reduce<{
    date: string;
    totalPeople: number;
  } | null>(
    (best, c) => (!best || c.totalPeople > best.totalPeople ? c : best),
    null,
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex-col md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings">← Bookings</Link>
          </Button>
          <h1 className="text-3xl font-bold">Bookings Dashboard</h1>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/kitesurfing/booking">Create New Booking</Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            asChild
            variant={activeFilter.value === f.value ? "default" : "outline"}
            className="rounded-full"
            size="sm"
          >
            <Link href={f.value === "all" ? "/bookings/dashboard" : `/bookings/dashboard?status=${f.value}`}>
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalBookingsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              People this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPeopleThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Busiest upcoming day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {busiestDay ? (
              <Link
                href={`/bookings/date/${busiestDay.date}`}
                className="hover:underline"
              >
                <p className="text-3xl font-bold">
                  {format(new Date(busiestDay.date), "MMM d")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {busiestDay.totalPeople} people
                </p>
              </Link>
            ) : (
              <p className="text-3xl font-bold">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click any date to see bookings for that day
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BookingCalendar counts={counts} />
        </CardContent>
      </Card>
    </div>
  );
}

export default BookingsDashboardPage;
