import { describe, expect, it } from "vitest";

import { selectPurchaseItemSchema, selectPurchaseSchema } from "@/db/schemas";

import {
  purchaseCreateFormSchema,
  purchaseCreateSchema,
  purchaseItemCreateSchema,
  purchaseItemFormSchema,
} from "./purchase.schema";

const existingMedicineItem = {
  medicineName: "Napa 500",
  isNewMedicine: false,
  qtyPurchased: "10",
  costPerUnit: "5",
  sellPerUnit: "7",
};

describe("purchaseItemFormSchema", () => {
  it("does not require a type or base unit for an existing medicine", () => {
    expect(purchaseItemFormSchema.safeParse(existingMedicineItem).success).toBe(
      true
    );
  });

  it("requires a medicine type and base unit for a new medicine", () => {
    const result = purchaseItemFormSchema.safeParse({
      ...existingMedicineItem,
      isNewMedicine: true,
    });

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["medicineType", "baseUnit"]));
  });

  it("accepts a new medicine with type and base unit", () => {
    const result = purchaseItemFormSchema.safeParse({
      ...existingMedicineItem,
      isNewMedicine: true,
      medicineType: "tablet",
      baseUnit: "tablet",
    });

    expect(result.success).toBe(true);
  });

  it("requires a medicine name", () => {
    const result = purchaseItemFormSchema.safeParse({
      ...existingMedicineItem,
      medicineName: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts decimal cost and sell prices", () => {
    const result = purchaseItemFormSchema.safeParse({
      ...existingMedicineItem,
      costPerUnit: "1.5",
      sellPerUnit: "2.75",
    });

    expect(result.success).toBe(true);
  });

  it.each(["1.555", "1.", ".5", "abc", "1.5.5"])(
    "rejects invalid cost price %s",
    (costPerUnit) => {
      const result = purchaseItemFormSchema.safeParse({
        ...existingMedicineItem,
        costPerUnit,
      });

      expect(result.success).toBe(false);
    }
  );

  it("rejects a zero decimal cost price", () => {
    const result = purchaseItemFormSchema.safeParse({
      ...existingMedicineItem,
      costPerUnit: "0.00",
    });

    expect(result.success).toBe(false);
  });
});

describe("purchaseItemCreateSchema", () => {
  it("requires a medicine name", () => {
    const result = purchaseItemCreateSchema.safeParse({
      medicineName: "",
      qtyPurchased: 1,
      costPerUnit: 0,
      sellPerUnit: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts decimal cost and sell prices", () => {
    const result = purchaseItemCreateSchema.safeParse({
      medicineName: "Napa 500",
      qtyPurchased: 2,
      costPerUnit: 1.5,
      sellPerUnit: 2.25,
    });

    expect(result.success).toBe(true);
  });

  it("keeps generic name and strength and trims blank values to undefined", () => {
    const result = purchaseItemCreateSchema.parse({
      medicineName: "Napa",
      genericName: "  Paracetamol ",
      strength: "   ",
      qtyPurchased: 1,
      costPerUnit: 1,
      sellPerUnit: 2,
    });

    expect(result.genericName).toBe("Paracetamol");
    expect(result.strength).toBeUndefined();
  });
});

describe("purchaseCreateSchema", () => {
  it("accepts a purchase with an empty item list", () => {
    const result = purchaseCreateSchema.safeParse({
      invoiceId: "0195f2c4-7b1a-7d2e-8f3a-123456789abc",
      vendorId: "0195f2c4-7b1a-7d2e-8f3a-123456789abd",
      paidAmount: 0,
      items: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a fractional paid amount within the total", () => {
    const result = purchaseCreateSchema.safeParse({
      invoiceId: "0195f2c4-7b1a-7d2e-8f3a-123456789abc",
      vendorId: "0195f2c4-7b1a-7d2e-8f3a-123456789abd",
      paidAmount: 2.5,
      items: [
        {
          medicineName: "Napa 500",
          qtyPurchased: 2,
          costPerUnit: 2.5,
          sellPerUnit: 3,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative paid amount", () => {
    const result = purchaseCreateSchema.safeParse({
      invoiceId: "0195f2c4-7b1a-7d2e-8f3a-123456789abc",
      vendorId: "0195f2c4-7b1a-7d2e-8f3a-123456789abd",
      paidAmount: -1,
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a paid amount above the total", () => {
    const result = purchaseCreateSchema.safeParse({
      invoiceId: "0195f2c4-7b1a-7d2e-8f3a-123456789abc",
      vendorId: "0195f2c4-7b1a-7d2e-8f3a-123456789abd",
      paidAmount: 6,
      items: [
        {
          medicineName: "Napa 500",
          qtyPurchased: 2,
          costPerUnit: 2.5,
          sellPerUnit: 3,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["paidAmount"]);
  });
});

describe("purchaseCreateFormSchema", () => {
  const baseFormValues = {
    invoiceId: "0195f2c4-7b1a-7d2e-8f3a-123456789abc",
    invoiceNo: "0001",
    vendorId: "0195f2c4-7b1a-7d2e-8f3a-123456789abd",
    paidAmount: "5",
    paidInFull: true,
    items: [{ ...existingMedicineItem, qtyPurchased: "2", costPerUnit: "2.5" }],
  };

  it("accepts a fractional paid amount equal to the subtotal", () => {
    expect(
      purchaseCreateFormSchema.safeParse({
        ...baseFormValues,
        paidAmount: "5.00",
      }).success
    ).toBe(true);
  });

  it("rejects a paid amount above the subtotal", () => {
    const result = purchaseCreateFormSchema.safeParse({
      ...baseFormValues,
      paidAmount: "5.01",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["paidAmount"]);
  });
});

describe("purchase money output schemas", () => {
  it("accepts decimal cost and sell prices", () => {
    expect(
      selectPurchaseItemSchema.shape.costPerUnit.safeParse(1.5).success
    ).toBe(true);
    expect(
      selectPurchaseItemSchema.shape.sellPerUnit.safeParse(2.25).success
    ).toBe(true);
  });

  it("accepts decimal purchase totals", () => {
    expect(selectPurchaseSchema.shape.subtotal.safeParse(4.5).success).toBe(
      true
    );
    expect(selectPurchaseSchema.shape.totalAmount.safeParse(4.5).success).toBe(
      true
    );
  });
});
