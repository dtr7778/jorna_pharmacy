import {
  Bandage,
  Droplet,
  FlaskRound,
  Package,
  Pill,
  PillBottle,
  Syringe,
  type LucideIcon,
} from "lucide-react";

import type { MedicineTypeEnumType } from "@/db/schemas/enums/zod-db-enums";

export const MEDICINE_TYPE_OPTIONS: Array<{
  value: MedicineTypeEnumType;
  label: string;
}> = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "liquid_bottle", label: "Liquid bottle" },
  { value: "liquid_drop", label: "Liquid drop" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "other", label: "Other" },
];

export function getMedicineTypeLabel(type: MedicineTypeEnumType): string {
  return (
    MEDICINE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

const MEDICINE_TYPE_ICONS: Record<MedicineTypeEnumType, LucideIcon> = {
  tablet: Pill,
  capsule: PillBottle,
  liquid_bottle: FlaskRound,
  liquid_drop: Droplet,
  injection: Syringe,
  cream: Bandage,
  other: Package,
};

export function getMedicineTypeIcon(type: MedicineTypeEnumType): LucideIcon {
  return MEDICINE_TYPE_ICONS[type];
}
