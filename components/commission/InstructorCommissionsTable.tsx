import { CommissionStatus } from "@prisma/client";
import { getInstructorCommissions } from "@/lib/actions/commission.actions";
import { listInstructors } from "@/lib/actions/user.actions";
import { getAllProducts } from "@/lib/actions/product.actions";
import { CommissionsFilters } from "./CommissionsFilters";
import { formatEGP } from "@/lib/commission";
import { InstructorCommissionsTableClient } from "./InstructorCommissionsTableClient";
import type { EditSheetServiceProduct } from "@/components/lessons/LessonSessionEditSheet";

type Props = {
  instructorId: string;
  from: Date;
  to: Date;
  status?: CommissionStatus;
};

export async function InstructorCommissionsTable({
  instructorId,
  from,
  to,
  status,
}: Props) {
  const [{ rows, totals }, instructors, productsRaw] = await Promise.all([
    getInstructorCommissions(instructorId, { from, to, status }),
    listInstructors(),
    getAllProducts({ type: "SERVICE", isActive: true }),
  ]);

  const serviceProducts: EditSheetServiceProduct[] = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Pending:</span>{" "}
            <span className="font-medium">{formatEGP(totals.pending.cents)}</span>{" "}
            <span className="text-muted-foreground">({totals.pending.count})</span>
          </div>
          <div>
            <span className="text-muted-foreground">Paid:</span>{" "}
            <span className="font-medium">{formatEGP(totals.paid.cents)}</span>{" "}
            <span className="text-muted-foreground">({totals.paid.count})</span>
          </div>
        </div>
        <CommissionsFilters status={status ?? "ALL"} />
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No commissions for this period.
        </p>
      ) : (
        <InstructorCommissionsTableClient
          rows={rows}
          instructors={instructors}
          serviceProducts={serviceProducts}
        />
      )}
    </div>
  );
}
