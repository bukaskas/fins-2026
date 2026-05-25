"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { updateOrderLines } from "@/lib/actions/order.actions";
import OrderLinesEditor, {
  type StagedLine,
} from "@/components/users/OrderLinesEditor";
import { type ProductSearchOption } from "@/components/products/ProductSearchField";

export default function EditOrderSheet({
  orderId,
  initialLines,
  products,
  open,
  onOpenChange,
}: {
  orderId: string;
  initialLines: StagedLine[];
  products: ProductSearchOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<StagedLine[]>(initialLines);
  const [submitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (lines.length === 0) {
      toast.error("Order must contain at least one line.");
      return;
    }
    startSubmit(async () => {
      const result = await updateOrderLines(
        orderId,
        lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      );
      if (result.success) {
        toast.success("Order updated.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update order.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit order</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Add, remove, or change line items. Bundle-credit products aren’t editable here.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <OrderLinesEditor
            products={products}
            initialLines={lines}
            onChange={setLines}
            disabled={submitting}
            allowBundles={false}
          />
        </div>

        <div className="border-t pt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || lines.length === 0}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
