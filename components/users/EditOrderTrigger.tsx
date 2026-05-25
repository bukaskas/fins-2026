"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditOrderSheet from "@/components/users/EditOrderSheet";
import { cancelOrder } from "@/lib/actions/order.actions";
import { type ProductSearchOption } from "@/components/products/ProductSearchField";
import { type StagedLine } from "@/components/users/OrderLinesEditor";

export default function EditOrderTrigger({
  orderId,
  initialLines,
  products,
  canEdit,
  canCancel,
  editReason,
  cancelReason,
}: {
  orderId: string;
  initialLines: StagedLine[];
  products: ProductSearchOption[];
  canEdit: boolean;
  canCancel: boolean;
  editReason?: string;
  cancelReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, startCancel] = useTransition();

  function handleCancel() {
    startCancel(async () => {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success("Order canceled");
        setConfirmingCancel(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to cancel order");
        setConfirmingCancel(false);
      }
    });
  }

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => canEdit && setOpen(true)}
          disabled={!canEdit}
          title={canEdit ? undefined : editReason}
          className="rounded border px-2 py-1 text-xs hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          Edit
        </button>
        {confirmingCancel ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              disabled={canceling}
              className="rounded border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={canceling || !canCancel}
              title={canCancel ? undefined : cancelReason}
              className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {canceling ? "…" : "Confirm"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => canCancel && setConfirmingCancel(true)}
            disabled={!canCancel}
            title={canCancel ? undefined : cancelReason}
            className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Cancel
          </button>
        )}
      </div>
      <EditOrderSheet
        orderId={orderId}
        initialLines={initialLines}
        products={products}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
