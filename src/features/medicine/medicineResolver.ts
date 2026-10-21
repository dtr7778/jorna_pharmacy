export interface MedicineInput<TType extends string> {
  medicineName: string;
  genericName?: string | null | undefined;
  strength?: string | null | undefined;
  medicineType?: TType | undefined;
  baseUnit?: string | undefined;
}

export interface MedicineIdentity {
  name: string;
  genericName: string | null;
  strength: string | null;
}

export interface ExistingMedicine {
  id: string;
  name: string;
  genericName: string | null;
  strength: string | null;
}

export interface NewMedicine<TType extends string> {
  id: string;
  name: string;
  genericName: string | null;
  strength: string | null;
  type: TType;
  baseUnit: string;
}

export interface ResolvedMedicines<TType extends string> {
  medicineIdByKey: Map<string, string>;
  newMedicines: NewMedicine<TType>[];
  unresolvedNames: string[];
}

const MEDICINE_LABEL_SEPARATOR = /\s+-\s+/;

export function normalizeMedicineName(name: string) {
  return name.trim().toLowerCase();
}

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getMedicineKey(
  name: string,
  genericName?: string | null | undefined,
  strength?: string | null | undefined
) {
  return JSON.stringify([
    normalizeMedicineName(name),
    normalizeOptionalText(genericName),
    normalizeOptionalText(strength),
  ]);
}

// The search field submits "name - genericName - strength" as the medicine name.
// The first segment is the name; explicit genericName/strength win, and any
// remaining segments fill the missing ones in that order.
export function getMedicineIdentity(
  item: Pick<MedicineInput<string>, "medicineName" | "genericName" | "strength">
): MedicineIdentity {
  const [labelName = "", ...labelDetails] = item.medicineName.split(
    MEDICINE_LABEL_SEPARATOR
  );
  const explicitGenericName = trimToNull(item.genericName);
  const explicitStrength = trimToNull(item.strength);

  const unclaimedDetails = labelDetails
    .map((detail) => trimToNull(detail))
    .filter((detail): detail is string => detail !== null)
    .filter(
      (detail) =>
        normalizeOptionalText(detail) !==
          normalizeOptionalText(explicitGenericName) &&
        normalizeOptionalText(detail) !==
          normalizeOptionalText(explicitStrength)
    );

  return {
    name: labelName.trim(),
    genericName: explicitGenericName ?? unclaimedDetails.shift() ?? null,
    strength: explicitStrength ?? unclaimedDetails.shift() ?? null,
  };
}

export function getMedicineItemKey(
  item: Pick<MedicineInput<string>, "medicineName" | "genericName" | "strength">
) {
  const identity = getMedicineIdentity(item);
  return getMedicineKey(identity.name, identity.genericName, identity.strength);
}

export function resolveMedicines<TType extends string>(
  items: ReadonlyArray<MedicineInput<TType>>,
  existingMedicines: ReadonlyArray<ExistingMedicine>
): ResolvedMedicines<TType> {
  console.log({ items, existingMedicines });

  const medicineIdByKey = new Map<string, string>();

  for (const medicine of existingMedicines) {
    medicineIdByKey.set(
      getMedicineKey(medicine.name, medicine.genericName, medicine.strength),
      medicine.id
    );
  }

  const newMedicines: NewMedicine<TType>[] = [];
  const pendingNames = new Map<string, string>();

  for (const item of items) {
    const identity = getMedicineIdentity(item);
    const key = getMedicineKey(
      identity.name,
      identity.genericName,
      identity.strength
    );
    if (medicineIdByKey.has(key)) continue;

    const baseUnit = item.baseUnit?.trim();
    if (!item.medicineType || !baseUnit) {
      pendingNames.set(key, identity.name);
      continue;
    }

    const id = crypto.randomUUID();
    medicineIdByKey.set(key, id);
    newMedicines.push({
      id,
      name: identity.name,
      genericName: identity.genericName,
      strength: identity.strength,
      type: item.medicineType,
      baseUnit,
    });
  }

  const unresolvedNames = [...pendingNames]
    .filter(([key]) => !medicineIdByKey.has(key))
    .map(([, name]) => name);

  return { medicineIdByKey, newMedicines, unresolvedNames };
}
