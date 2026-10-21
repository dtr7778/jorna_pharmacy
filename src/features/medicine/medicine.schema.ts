import z from "zod";

import { MedicineTypeEnumSchema } from "@/db/schemas/enums/zod-db-enums";
import { emptyStrSchema } from "@/lib/zod-schemas/baseZodSchema";

export const medicineCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Medicine name is required")
    .max(150, "Medicine name is too long"),
  genericName: emptyStrSchema.optional(),
  strength: emptyStrSchema.optional(),
  categoryId: z.uuid("Invalid category").optional(),
  vendorId: z.uuid("Invalid vendor").optional(),
  type: MedicineTypeEnumSchema,
  baseUnit: z
    .string()
    .min(1, "Base unit is required")
    .max(50, "Base unit is too long"),
  rackLocation: emptyStrSchema.optional(),
  minimumStock: z.coerce.number().int().nonnegative().default(0),
});
export type MedicineCreateType = z.infer<typeof medicineCreateSchema>;
export type MedicineCreateInputType = z.input<typeof medicineCreateSchema>;

export const medicineUpdateSchema = medicineCreateSchema
  .extend({
    isActive: z.boolean(),
  })
  .partial();
export type MedicineUpdateType = z.infer<typeof medicineUpdateSchema>;
export type MedicineUpdateInputType = z.input<typeof medicineUpdateSchema>;
