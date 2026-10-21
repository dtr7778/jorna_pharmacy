import z from "zod";

import { MedicineTypeEnumSchema } from "@/db/schemas/enums/zod-db-enums";

const requiredWholeNumber = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .refine((value) => Number(value) > 0, `${label} must be greater than 0`);

const requiredDecimal = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(
      /^\d+(\.\d{1,2})?$/,
      `${label} must be a number with up to 2 decimal places`
    )
    .refine((value) => Number(value) > 0, `${label} must be greater than 0`);

const moneyInput = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined || value === "" || /^\d+(\.\d{1,2})?$/.test(value),
      `${label} must be a number with up to 2 decimal places`
    );

const optionalPositiveWholeNumber = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || /^\d+$/.test(value),
      `${label} must be a whole number`
    )
    .refine(
      (value) => value === undefined || value === "" || Number(value) > 0,
      `${label} must be greater than 0`
    );

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const invoiceNoSchema = z
  .string()
  .regex(/^\d{4,}$/, "Invoice number must be at least 4 digits");

export const purchaseItemFormSchema = z
  .object({
    medicineName: z
      .string()
      .trim()
      .min(1, "Enter a medicine name")
      .max(200, "Medicine name is too long"),
    isNewMedicine: z.boolean(),
    medicineType: MedicineTypeEnumSchema.optional(),
    genericName: optionalTrimmedString(100),
    strength: optionalTrimmedString(100),
    baseUnit: z.string().optional(),
    tabletsPerStrip: optionalPositiveWholeNumber("Tablets per strip"),
    stripsPerBox: optionalPositiveWholeNumber("Strips per box"),
    qtyPurchased: requiredWholeNumber("Quantity"),
    costPerUnit: requiredDecimal("Cost per unit"),
    sellPerUnit: requiredDecimal("Sell price per unit"),
    expiryDate: z.date().optional(),
  })
  .superRefine((item, ctx) => {
    if (!item.isNewMedicine) return;

    if (!item.medicineType) {
      ctx.addIssue({
        code: "custom",
        path: ["medicineType"],
        message: "Select a medicine type",
      });
    }

    if (!item.baseUnit?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["baseUnit"],
        message: "Base unit is required",
      });
    }
  });
export type PurchaseItemFormType = z.infer<typeof purchaseItemFormSchema>;

export const purchaseCreateFormSchema = z
  .object({
    invoiceId: z.uuid("Invoice number is required"),
    invoiceNo: invoiceNoSchema,
    vendorId: z.uuid("Vendor is required"),
    vendorInvoiceNo: z
      .string()
      .max(100, "Invoice number is too long")
      .optional(),
    paidAmount: moneyInput("Paid amount"),
    paidInFull: z.boolean(),
    note: z.string().max(1000, "Note is too long").optional(),
    items: z.array(purchaseItemFormSchema),
  })
  .superRefine((values, ctx) => {
    const subtotal = values.items.reduce(
      (sum, item) => sum + Number(item.qtyPurchased) * Number(item.costPerUnit),
      0
    );

    const paidAmount = Number(values.paidAmount || 0);
    const total = subtotal;

    if (paidAmount > total) {
      ctx.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "Paid amount cannot exceed the purchase total",
      });
    }
  });
export type PurchaseCreateFormType = z.infer<typeof purchaseCreateFormSchema>;
export type PurchaseCreateFormInputType = z.input<
  typeof purchaseCreateFormSchema
>;

export const purchaseItemCreateSchema = z.object({
  medicineName: z.string().trim().min(1).max(200),
  genericName: optionalTrimmedString(100),
  strength: optionalTrimmedString(100),
  medicineType: MedicineTypeEnumSchema.optional(),
  baseUnit: optionalTrimmedString(50),
  tabletsPerStrip: z.number().int().positive().optional(),
  stripsPerBox: z.number().int().positive().optional(),
  qtyPurchased: z.number().int().positive(),
  costPerUnit: z.number().nonnegative(),
  sellPerUnit: z.number().nonnegative(),
  expiryDate: z.coerce.date().optional(),
});
export type PurchaseItemCreateType = z.infer<typeof purchaseItemCreateSchema>;

export const purchaseCreateSchema = z
  .object({
    invoiceId: z.uuid(),
    vendorId: z.uuid(),
    vendorInvoiceNo: optionalTrimmedString(100),
    paidAmount: z.number().nonnegative(),
    note: optionalTrimmedString(1000),
    items: z.array(purchaseItemCreateSchema),
  })
  .superRefine((values, ctx) => {
    const subtotal = values.items.reduce(
      (sum, item) => sum + item.qtyPurchased * item.costPerUnit,
      0
    );
    const total = subtotal;

    if (values.paidAmount > total) {
      ctx.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "Paid amount cannot exceed the purchase total",
      });
    }
  });
export type PurchaseCreateType = z.infer<typeof purchaseCreateSchema>;

export const emptyPurchaseItemFormValues: PurchaseItemFormType = {
  medicineName: "",
  genericName: "",
  strength: "",
  isNewMedicine: false,
  medicineType: undefined,
  baseUnit: undefined,
  tabletsPerStrip: undefined,
  stripsPerBox: undefined,
  qtyPurchased: "1",
  costPerUnit: "",
  sellPerUnit: "",
  expiryDate: undefined,
};
