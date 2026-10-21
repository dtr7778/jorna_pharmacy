import { describe, expect, it } from "vitest";

import {
  getMedicineIdentity,
  getMedicineKey,
  resolveMedicines,
} from "./medicineResolver";

const existingMedicines = [
  {
    id: "med-1",
    name: "Napa",
    genericName: "Paracetamol",
    strength: "500",
  },
];

describe("resolveMedicines", () => {
  it("links to an existing medicine when name, generic name and strength match ignoring case and surrounding spaces", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "  napa ",
          genericName: " paracetamol ",
          strength: "500 ",
          medicineType: undefined,
          baseUnit: undefined,
        },
      ],
      existingMedicines
    );

    expect(
      result.medicineIdByKey.get(getMedicineKey("napa", "paracetamol", "500"))
    ).toBe("med-1");
    expect(result.newMedicines).toEqual([]);
    expect(result.unresolvedNames).toEqual([]);
  });

  it("creates a new medicine when the strength differs from the existing one", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Napa",
          genericName: "Paracetamol",
          strength: "650",
          medicineType: "tablet",
          baseUnit: "tablet",
        },
      ],
      existingMedicines
    );

    expect(result.newMedicines).toEqual([
      {
        id: expect.any(String),
        name: "Napa",
        genericName: "Paracetamol",
        strength: "650",
        type: "tablet",
        baseUnit: "tablet",
      },
    ]);
  });

  it("creates a new medicine when the generic name differs from the existing one", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Napa",
          genericName: "Acetaminophen",
          strength: "500",
          medicineType: "tablet",
          baseUnit: "tablet",
        },
      ],
      existingMedicines
    );

    expect(result.newMedicines).toHaveLength(1);
    expect(result.newMedicines[0]?.genericName).toBe("Acetaminophen");
  });

  it("does not link a medicine with a blank strength to one that has a strength", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Napa",
          genericName: "Paracetamol",
          medicineType: undefined,
          baseUnit: undefined,
        },
      ],
      existingMedicines
    );

    expect(result.unresolvedNames).toEqual(["Napa"]);
    expect(result.newMedicines).toEqual([]);
  });

  it("links blank generic name and strength to an existing medicine that has none", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Zinc",
          genericName: "",
          strength: undefined,
          medicineType: undefined,
          baseUnit: undefined,
        },
      ],
      [{ id: "med-2", name: "Zinc", genericName: null, strength: null }]
    );

    expect(result.medicineIdByKey.get(getMedicineKey("Zinc"))).toBe("med-2");
    expect(result.unresolvedNames).toEqual([]);
  });

  it("creates one new medicine per unmatched identity using the item's type and base unit", () => {
    const result = resolveMedicines(
      [
        { medicineName: "Ace", medicineType: "tablet", baseUnit: "tablet" },
        { medicineName: "ace", medicineType: "tablet", baseUnit: "tablet" },
      ],
      existingMedicines
    );

    expect(result.newMedicines).toEqual([
      {
        id: expect.any(String),
        name: "Ace",
        genericName: null,
        strength: null,
        type: "tablet",
        baseUnit: "tablet",
      },
    ]);
    expect(result.medicineIdByKey.get(getMedicineKey("ace"))).toBe(
      result.newMedicines[0]?.id
    );
  });

  it("reports unmatched names that have no medicine type", () => {
    const result = resolveMedicines(
      [{ medicineName: "Zinc", medicineType: undefined, baseUnit: "tablet" }],
      existingMedicines
    );

    expect(result.unresolvedNames).toEqual(["Zinc"]);
    expect(result.newMedicines).toEqual([]);
  });

  it("returns no medicines for an empty item list", () => {
    const result = resolveMedicines([], existingMedicines);

    expect(
      result.medicineIdByKey.get(getMedicineKey("Napa", "Paracetamol", "500"))
    ).toBe("med-1");
    expect(result.newMedicines).toEqual([]);
    expect(result.unresolvedNames).toEqual([]);
  });

  it("links a selected label 'name - genericName - strength' to the existing medicine", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Napa - Paracetamol - 500",
          medicineType: undefined,
          baseUnit: undefined,
        },
      ],
      existingMedicines
    );

    expect(
      result.medicineIdByKey.get(getMedicineKey("Napa", "Paracetamol", "500"))
    ).toBe("med-1");
    expect(result.newMedicines).toEqual([]);
    expect(result.unresolvedNames).toEqual([]);
  });

  it("stores only the name segment when creating a medicine from a label", () => {
    const result = resolveMedicines(
      [
        {
          medicineName: "Ace - Aceclofenac - 100",
          medicineType: "tablet",
          baseUnit: "tablet",
        },
      ],
      existingMedicines
    );

    expect(result.newMedicines).toEqual([
      {
        id: expect.any(String),
        name: "Ace",
        genericName: "Aceclofenac",
        strength: "100",
        type: "tablet",
        baseUnit: "tablet",
      },
    ]);
  });

  it("prefers explicit generic name and strength over label segments", () => {
    expect(
      getMedicineIdentity({
        medicineName: "Napa - Paracetamol - 500",
        genericName: "Acetaminophen",
        strength: "650",
      })
    ).toEqual({ name: "Napa", genericName: "Acetaminophen", strength: "650" });
  });

  it("fills a missing strength from the label without reading it as the generic name", () => {
    expect(
      getMedicineIdentity({
        medicineName: "Napa - 500",
        genericName: undefined,
        strength: "500",
      })
    ).toEqual({ name: "Napa", genericName: null, strength: "500" });
  });

  it("keeps hyphens inside a name when they are not spaced separators", () => {
    expect(
      getMedicineIdentity({
        medicineName: "Co-amoxiclav",
        genericName: "Amoxiclav",
      })
    ).toEqual({
      name: "Co-amoxiclav",
      genericName: "Amoxiclav",
      strength: null,
    });
  });
});
