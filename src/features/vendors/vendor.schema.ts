import z from "zod";

import { emptyStrSchema } from "@/lib/zod-schemas/baseZodSchema";

export const vendorCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(100, "Name is too long"),
  phone: emptyStrSchema.optional(),
  address: emptyStrSchema.optional(),
  note: emptyStrSchema.optional(),
});
export type VendorCreateType = z.infer<typeof vendorCreateSchema>;

export const vendorUpdateSchema = vendorCreateSchema
  .extend({
    isActive: z.boolean(),
  })
  .partial();
export type VendorUpdateType = z.infer<typeof vendorUpdateSchema>;

export const vendorPaymentCreateSchema = z.object({
  vendorId: z.uuid("Vendor is required"),
  purchaseId: z.uuid().optional(),
  amount: z
    .number("Payment amount is required")
    .int("Payment amount must be a whole number")
    .positive("Payment amount must be greater than 0"),
  note: emptyStrSchema.optional(),
});
export type VendorPaymentCreateType = z.infer<typeof vendorPaymentCreateSchema>;

export const vendorPaymentCreateFormSchema = z.object({
  vendorId: z.uuid("Vendor is required"),
  purchaseId: z.uuid().optional(),
  amount: z
    .string()
    .min(1, "Payment amount is required")
    .regex(/^\d+$/, "Payment amount must be a whole number")
    .refine(
      (value) => Number(value) > 0,
      "Payment amount must be greater than 0"
    ),
  note: emptyStrSchema.optional(),
});
export type VendorPaymentCreateFormType = z.infer<
  typeof vendorPaymentCreateFormSchema
>;
