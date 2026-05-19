import { CommissionStatus } from "@prisma/client";
import { getInstructorCommissions } from "@/lib/actions/commission.actions";
import { listInstructors } from "@/lib/actions/user.actions";
import { getAllProducts } from "@/lib/actions/product.actions";
import { CommissionsFilters } from "./CommissionsFilters";
import { formatEGP } from "@/lib/commission";
import { InstructorCommissionsTableClient } from "./InstructorCommissionsTableClient";
import { SettleCommissionsButton } from "./SettleCommissionsButton";
import type { EditSheetServiceProduct } from "@/components/lessons/LessonSessionEditSheet";

type Props = {
  instructorId: string;
  from: Date;
  to: Date;
  status?: CommissionStatus;
  periodLabel: string;
};

export async function InstructorCommissionsTable({
  instructorId,
  from,
  to,
  status,
  periodLabel,
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

  const revenueCents = rows.reduce(
    (sum, r) => sum + (r.session.deliveredRevenueCents ?? 0),
    0
  );
  const commissionCents = rows.reduce((sum, r) => sum + r.finalAmountCents, 0);
  const profitCents = revenueCents - commissionCents;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-4 text-sm flex-wrap">
          <div>
            <span className="text-muted-foreground">Revenue:</span>{" "}
            <span className="font-medium">{formatEGP(revenueCents)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Commission:</span>{" "}
            <span className="font-medium">{formatEGP(commissionCents)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Profit:</span>{" "}
            <span className={`font-medium ${profitCents < 0 ? "text-red-600" : ""}`}>
              {formatEGP(profitCents)}
            </span>
          </div>
          <div className="text-muted-foreground">·</div>
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
        <div className="flex items-center gap-2">
          <CommissionsFilters status={status ?? "ALL"} />
          <SettleCommissionsButton
            instructorId={instructorId}
            from={from.toISOString()}
            to={to.toISOString()}
            pendingCount={totals.pending.count}
            pendingCents={totals.pending.cents}
            periodLabel={periodLabel}
          />
        </div>
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
