import z from "zod";

export const cashClosingListFilterSchema = z.object({
  periodStart: z
    .object({
      from: z.coerce
        .date()
        .describe("Closing period start from date")
        .optional(),
      to: z.coerce.date().describe("Closing period start to date").optional(),
    })
    .optional(),
});
export type CashClosingListFilterType = z.infer<
  typeof cashClosingListFilterSchema
>;

export const cashClosingCreateSchema = z.object({
  totalSales: z
    .string()
    .min(1, "Total sales is required")
    .regex(/^\d+$/, "Total sales must be a whole number")
    .refine((value) => Number(value) > 0, "Total sales must be greater than 0"),
  totalSalary: z
    .string()
    .min(1, "Total salary is required")
    .regex(/^\d+$/, "Total salary must be a whole number")
    .refine(
      (value) => Number(value) > 0,
      "Total salary must be greater than 0"
    ),
});
export type CashClosingCreateType = z.infer<typeof cashClosingCreateSchema>;
export type CashClosingCreateInputType = z.input<
  typeof cashClosingCreateSchema
>;
