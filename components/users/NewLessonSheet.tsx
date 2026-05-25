"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NewLessonForm, {
  type LessonProductOption,
} from "@/components/lessons/NewLessonForm";

type StudentRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function NewLessonSheet({
  user,
  instructors,
  lessonProducts,
  initialBalance,
  open,
  onOpenChange,
}: {
  user: StudentRow;
  instructors: { id: string; name: string | null; email: string }[];
  lessonProducts: LessonProductOption[];
  initialBalance: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New lesson</SheetTitle>
        </SheetHeader>
        <div className="mt-4 px-1 pb-6">
          <NewLessonForm
            key={open ? "open" : "closed"}
            students={[user]}
            instructors={instructors}
            lessonProducts={lessonProducts}
            initialStudentId={user.id}
            initialBalance={initialBalance}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
