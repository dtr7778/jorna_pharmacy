import z from "zod";

import { emptyStrSchema } from "@/lib/zod-schemas/baseZodSchema";

export const customerCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Name is too long"),
  phone: emptyStrSchema.optional(),
  address: emptyStrSchema.optional(),
  note: emptyStrSchema.optional(),
});
export type CustomerCreateType = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema
  .extend({
    isActive: z.boolean(),
  })
  .partial();
export type CustomerUpdateType = z.infer<typeof customerUpdateSchema>;

export const customerPaymentCreateSchema = z.object({
  customerId: z.uuid("Customer is required"),
  saleId: z.uuid().optional(),
  amount: z
    .number("Payment amount is required")
    .int("Payment amount must be a whole number")
    .positive("Payment amount must be greater than 0"),
  note: emptyStrSchema.optional(),
});
export type CustomerPaymentCreateType = z.infer<
  typeof customerPaymentCreateSchema
>;

export const customerPaymentCreateFormSchema = z.object({
  customerId: z.uuid("Customer is required"),
  saleId: z.uuid().optional(),
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
export type CustomerPaymentCreateFormType = z.infer<
  typeof customerPaymentCreateFormSchema
>;
