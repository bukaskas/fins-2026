import { BookingStatus } from "@prisma/client";

const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  PENDING:             { label: "Pending",          className: "bg-yellow-100 text-yellow-800" },
  REQUEST_SENT:        { label: "Request Sent",     className: "bg-sky-100 text-sky-800" },
  UNDER_REVIEW:        { label: "Under Review",     className: "bg-orange-100 text-orange-800" },
  WAITING_PAYMENT:     { label: "Waiting Payment",  className: "bg-violet-100 text-violet-800" },
  CONFIRMED:           { label: "Confirmed",        className: "bg-green-100 text-green-800" },
  ARRIVED:             { label: "Arrived",          className: "bg-teal-100 text-teal-800" },
  DECLINED:            { label: "Declined",         className: "bg-red-100 text-red-800" },
  NO_RESPONSE_EXPIRED: { label: "No Response",      className: "bg-gray-200 text-gray-500" },
  CANCELED:            { label: "Canceled",         className: "bg-gray-100 text-gray-600" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = BOOKING_STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
