type Movement = {
  id: string;
  type: string;
  qty: number;
  reason: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
  rentalLine: {
    rental: { id: string; guest: { name: string | null; email: string } };
  } | null;
};

export function MovementHistory({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No movements recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-left">Reason</th>
            <th className="px-3 py-2 text-left">Guest</th>
            <th className="px-3 py-2 text-left">By</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-3 py-2">
                {new Date(m.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2">{m.type}</td>
              <td className="px-3 py-2 text-right">{m.qty}</td>
              <td className="px-3 py-2">{m.reason || "—"}</td>
              <td className="px-3 py-2">
                {m.rentalLine
                  ? m.rentalLine.rental.guest.name ||
                    m.rentalLine.rental.guest.email
                  : "—"}
              </td>
              <td className="px-3 py-2">
                {m.actor?.name || m.actor?.email || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
