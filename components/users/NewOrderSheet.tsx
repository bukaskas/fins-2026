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
import { createOrderFromForm } from "@/lib/actions/order.actions";
import OrderLinesEditor, {
  type StagedLine,
} from "@/components/users/OrderLinesEditor";
import { type ProductSearchOption } from "@/components/products/ProductSearchField";

export default function NewOrderSheet({
  userId,
  products,
  open,
  onOpenChange,
}: {
  userId: string;
  products: ProductSearchOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<StagedLine[]>([]);
  const [submitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (lines.length === 0) {
      toast.error("Add at least one product.");
      return;
    }
    startSubmit(async () => {
      const result = await createOrderFromForm({
        userId,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      });
      if (result.success) {
        toast.success("Order created.");
        setLines([]);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create order.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Sell products</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Creates an OPEN order. Settle it from the Payments section.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <OrderLinesEditor
            products={products}
            initialLines={lines}
            onChange={setLines}
            disabled={submitting}
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
            {submitting ? "Creating…" : "Create order"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
