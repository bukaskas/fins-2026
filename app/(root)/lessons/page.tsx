import { getAllLessons } from "@/lib/actions/lessons.actions";
import { listInstructors } from "@/lib/actions/user.actions";
import { getAllProducts } from "@/lib/actions/product.actions";
import { LessonsTable } from "@/components/lessons/LessonsTable";
import type {
  SessionRow,
  EditSheetServiceProduct,
} from "@/components/lessons/LessonSessionEditSheet";

export default async function LessonsPage() {
  const [lessons, instructors, productsRaw] = await Promise.all([
    getAllLessons(),
    listInstructors(),
    getAllProducts({ type: "SERVICE", isActive: true }),
  ]);

  const serviceProducts: EditSheetServiceProduct[] = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
  }));

  const rows: SessionRow[] = lessons.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    lessonType: s.lessonType,
    capacity: s.capacity,
    notes: s.notes,
    instructor: s.instructor,
    bookings: s.bookings.map((b) => ({
      id: b.id,
      status: b.status,
      guest: { id: b.guest.id, name: b.guest.name, email: b.guest.email, phone: b.guest.phone },
    })),
    commission: s.commission
      ? {
          id: s.commission.id,
          commissionType: s.commission.commissionType,
          durationMinutes: s.commission.durationMinutes,
          rateAtCreationCents: s.commission.rateAtCreationCents,
          calculatedAmountCents: s.commission.calculatedAmountCents,
          overrideAmountCents: s.commission.overrideAmountCents,
          finalAmountCents: s.commission.finalAmountCents,
          status: s.commission.status,
        }
      : null,
  }));

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Lessons</h1>
      <LessonsTable
        lessons={rows}
        instructors={instructors}
        serviceProducts={serviceProducts}
      />
    </main>
  );
}
