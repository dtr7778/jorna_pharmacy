import z from "zod";

export const saleListFilterSchema = z.object({
  createdAt: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
});
export type SaleListFilterType = z.infer<typeof saleListFilterSchema>;
