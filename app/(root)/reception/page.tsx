import Link from "next/link";
import { BookingStatus } from "@prisma/client";

import {
  getReceptionDashboard,
  type ReceptionDashboardData,
} from "@/lib/actions/booking.actions";
import { BookingQuickActions } from "@/components/reception/BookingQuickActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/commission";
import { DAILY_CAPACITY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function AllClear({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-2">✓ {text}</p>;
}

function BookingLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/bookings/${id}`} className="font-medium hover:underline">
      {name}
    </Link>
  );
}

function hoursLeft(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, (expiresAt.getTime() - Date.now()) / 3_600_000);
}

function dayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function ReceptionPage() {
  const data: ReceptionDashboardData = await getReceptionDashboard();
  const { pending, awaitingPayment, arrivals, capacity } = data;
  const notArrived = arrivals.filter(
    (b) => b.bookingStatus === BookingStatus.CONFIRMED,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reception desk</h1>
        <p className="text-sm text-muted-foreground">
          Next steps, most urgent first.
        </p>
      </div>

      {/* 1 — Needs review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Needs review
            {pending.length > 0 && <Badge>{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {pending.length === 0 && <AllClear text="No booking requests waiting." />}
          {pending.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <BookingLink id={b.id} name={b.name} />
                <p className="text-xs text-muted-foreground">
                  {b.service} · {b.date.toLocaleDateString("en-GB", { timeZone: "UTC" })} ·{" "}
                  {b.numberOfPeople + (b.numberOfKids ?? 0)} people · {b.phone}
                </p>
              </div>
              <BookingQuickActions
                bookingId={b.id}
                actions={[
                  { label: "Confirm & send payment link", status: BookingStatus.WAITING_PAYMENT, variant: "default" },
                  { label: "Decline", status: BookingStatus.DECLINED, variant: "destructive" },
                ]}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2 — Payment expiring */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Waiting for payment
            {awaitingPayment.length > 0 && (
              <Badge variant="secondary">{awaitingPayment.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {awaitingPayment.length === 0 && <AllClear text="No payments outstanding." />}
          {awaitingPayment.map((b) => {
            const left = hoursLeft(b.paymentExpiresAt);
            const urgent = left !== null && left < 6;
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <BookingLink id={b.id} name={b.name} />
                  <p className="text-xs text-muted-foreground">
                    {b.service} · {b.date.toLocaleDateString("en-GB", { timeZone: "UTC" })} · {b.phone}
                    {b.paymentLink && (
                      <>
                        {" · "}
                        <a href={b.paymentLink} className="underline" target="_blank" rel="noreferrer">
                          payment link
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <Badge variant={urgent ? "destructive" : "secondary"}>
                  {left === null ? "no deadline" : urgent ? `⚠ ${left.toFixed(1)}h left — chase now` : `${Math.floor(left)}h left`}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3 — Today's arrivals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Today&apos;s arrivals
            {notArrived.length > 0 && <Badge variant="secondary">{notArrived.length} to check in</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {arrivals.length === 0 && <AllClear text="No confirmed bookings for today." />}
          {arrivals.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <BookingLink id={b.id} name={b.name} />
                <p className="text-xs text-muted-foreground">
                  {b.time ? `${b.time} · ` : ""}
                  {b.service} · {b.numberOfPeople + (b.numberOfKids ?? 0)} people
                  {b.dueCents > 0 ? (
                    <span className="text-destructive font-medium"> · due {formatEGP(b.dueCents)}</span>
                  ) : (
                    " · fully paid"
                  )}
                </p>
              </div>
              {b.bookingStatus === BookingStatus.ARRIVED ? (
                <Badge variant="outline">Arrived ✓</Badge>
              ) : (
                <BookingQuickActions
                  bookingId={b.id}
                  actions={[{ label: "Mark arrived", status: BookingStatus.ARRIVED, variant: "default" }]}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4 — Capacity next 7 days */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Capacity — next 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {capacity.map((d) => {
              const pct = Math.min(100, Math.round((d.people / DAILY_CAPACITY) * 100));
              const tone = d.closed
                ? "bg-destructive/15 text-destructive"
                : pct >= 80
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-muted";
              return (
                <div key={d.date} className={`rounded-md px-1 py-2 ${tone}`}>
                  <p className="text-[0.65rem] uppercase tracking-wide">{dayLabel(d.date)}</p>
                  <p className="text-sm font-semibold">
                    {d.closed ? "Closed" : `${d.people}/${DAILY_CAPACITY}`}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Dates auto-close at {DAILY_CAPACITY} confirmed people. Amber = 80%+ full.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
