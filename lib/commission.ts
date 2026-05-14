import { CommissionType, LessonType } from "@prisma/client";

export function commissionTypeFromLessonType(t: LessonType): CommissionType {
  switch (t) {
    case "PRIVATE":
      return "PRIVATE";
    case "GROUP":
      return "SEMI_PRIVATE";
    case "EXTRA_PRIVATE":
      return "EXTRA_PRIVATE";
    case "EXTRA_GROUP":
      return "EXTRA_SEMI_PRIVATE";
    case "FOIL":
      return "FOIL";
    case "KIDS":
      return "KIDS";
  }
}

export type InstructorRateField =
  | "privateRateCents"
  | "semiPrivateRateCents"
  | "extraPrivateRateCents"
  | "extraSemiPrivateRateCents"
  | "foilRateCents"
  | "kidsRateCents";

export function rateFieldForCommissionType(
  t: CommissionType
): InstructorRateField {
  switch (t) {
    case "PRIVATE":
      return "privateRateCents";
    case "SEMI_PRIVATE":
      return "semiPrivateRateCents";
    case "EXTRA_PRIVATE":
      return "extraPrivateRateCents";
    case "EXTRA_SEMI_PRIVATE":
      return "extraSemiPrivateRateCents";
    case "FOIL":
      return "foilRateCents";
    case "KIDS":
      return "kidsRateCents";
  }
}

export function calculateCommissionCents(
  durationMinutes: number,
  rateCents: number
): number {
  return Math.round((durationMinutes / 60) * rateCents);
}

const EGP_FORMATTER = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

export function formatEGP(cents: number): string {
  return EGP_FORMATTER.format(cents / 100);
}

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  EXTRA_PRIVATE: "Extra private",
  EXTRA_SEMI_PRIVATE: "Extra semi-private",
  FOIL: "Foil",
  KIDS: "Kids",
};
