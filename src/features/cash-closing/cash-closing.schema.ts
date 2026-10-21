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
