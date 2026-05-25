"use client";

import { useState } from "react";
import NewLessonSheet from "@/components/users/NewLessonSheet";
import NewOrderSheet from "@/components/users/NewOrderSheet";
import { type LessonProductOption } from "@/components/lessons/NewLessonForm";
import { type ProductSearchOption } from "@/components/products/ProductSearchField";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function UserDetailActionsBar({
  user,
  instructors,
  lessonProducts,
  allProducts,
  initialBalance,
}: {
  user: UserRow;
  instructors: { id: string; name: string | null; email: string }[];
  lessonProducts: LessonProductOption[];
  allProducts: ProductSearchOption[];
  initialBalance: number | null;
}) {
  const [lessonOpen, setLessonOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setLessonOpen(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-black/85 transition-colors"
      >
        + Lesson
      </button>
      <button
        type="button"
        onClick={() => setOrderOpen(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-black/85 transition-colors"
      >
        + Product
      </button>

      <NewLessonSheet
        user={user}
        instructors={instructors}
        lessonProducts={lessonProducts}
        initialBalance={initialBalance}
        open={lessonOpen}
        onOpenChange={setLessonOpen}
      />
      <NewOrderSheet
        userId={user.id}
        products={allProducts}
        open={orderOpen}
        onOpenChange={setOrderOpen}
      />
    </>
  );
}
