import { BookingStatus, PaymentStatus } from "@prisma/client";

const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  PENDING:   { label: "Pending",   className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  DECLINED:  { label: "Declined",  className: "bg-red-100 text-red-800" },
  CANCELED:  { label: "Canceled",  className: "bg-gray-100 text-gray-600" },
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  UNPAID:       { label: "Unpaid",       className: "bg-yellow-100 text-yellow-800" },
  DEPOSIT_PAID: { label: "Deposit Paid", className: "bg-blue-100 text-blue-800" },
  PAID:         { label: "Paid",         className: "bg-green-100 text-green-800" },
  REFUNDED:     { label: "Refunded",     className: "bg-purple-100 text-purple-800" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = BOOKING_STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = PAYMENT_STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
