import { RentalStatus } from "@prisma/client";

const RENTAL_STATUS_STYLES: Record<RentalStatus, { label: string; className: string }> = {
  OPEN:     { label: "Active",   className: "bg-blue-100 text-blue-800" },
  RETURNED: { label: "Returned", className: "bg-green-100 text-green-800" },
  LATE:     { label: "Overdue",  className: "bg-red-100 text-red-800" },
  CANCELED: { label: "Canceled", className: "bg-gray-100 text-gray-600" },
};

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  const { label, className } = RENTAL_STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
