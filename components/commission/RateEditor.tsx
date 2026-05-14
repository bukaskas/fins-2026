"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Rates = {
  privateRateCents: number;
  semiPrivateRateCents: number;
  extraPrivateRateCents: number;
  extraSemiPrivateRateCents: number;
  foilRateCents: number;
  kidsRateCents: number;
};

type FieldKey = keyof Rates;

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "privateRateCents", label: "Private (per hour)" },
  { key: "semiPrivateRateCents", label: "Semi-private (per hour)" },
  { key: "extraPrivateRateCents", label: "Extra private (per hour)" },
  { key: "extraSemiPrivateRateCents", label: "Extra semi-private (per hour)" },
  { key: "foilRateCents", label: "Foil (per hour)" },
  { key: "kidsRateCents", label: "Kids (per hour)" },
];

type Props = {
  value: Rates;
  onChange: (next: Rates) => void;
  disabled?: boolean;
};

export function RateEditor({ value, onChange, disabled }: Props) {
  function set(key: FieldKey, raw: string) {
    const trimmed = raw.trim();
    const egp = trimmed === "" ? 0 : Math.max(0, Number(trimmed));
    const cents = Math.round(egp * 100);
    onChange({ ...value, [key]: cents });
  }

  return (
    <div className="rounded-md border bg-muted/30 px-4 py-3">
      <p className="text-sm font-medium mb-3">Commission rates (EGP / hour)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <Field key={key}>
            <FieldLabel htmlFor={key}>{label}</FieldLabel>
            <Input
              id={key}
              type="number"
              min={0}
              step={1}
              value={Math.round(value[key] / 100) || ""}
              onChange={(e) => set(key, e.target.value)}
              disabled={disabled}
              className="rounded-full"
            />
            <FieldError errors={[]} />
          </Field>
        ))}
      </div>
    </div>
  );
}
