import z from "zod";

import { selectCashClosingSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { cashClosingListFilterSchema } from "../cash-closing.schema";

const tags = ["Cash Closing"] as const;

const cashClosingListRowSchema = selectCashClosingSchema
  .pick({
    id: true,
    periodStart: true,
    periodEnd: true,
    openingCash: true,
    totalSales: true,
    totalReturns: true,
    cashReceived: true,
    vendorPaid: true,
    totalExpenses: true,
    totalSalary: true,
    expectedCash: true,
    countedCash: true,
    difference: true,
    closedBy: true,
    note: true,
    createdAt: true,
  })
  .extend({
    closedByName: z.string().nullable(),
  });

const listCashClosingContract = baseContract
  .route({
    method: "GET",
    path: "/cash-closings/list",
    description:
      "List cash closings with their period, totals, counted cash, and difference",
    tags,
  })
  .input(
    paginateInputSchema<typeof cashClosingListRowSchema>({
      searchFields: ["closedByName", "note"],
      orderFields: [
        "periodStart",
        "periodEnd",
        "openingCash",
        "totalSales",
        "totalReturns",
        "cashReceived",
        "vendorPaid",
        "totalExpenses",
        "totalSalary",
        "expectedCash",
        "countedCash",
        "difference",
        "createdAt",
      ],
      filter: cashClosingListFilterSchema,
    })
  )
  .output(apiOutputSchema(paginateOutputSchema(cashClosingListRowSchema)));
export type ListCashClosingContractType = InferContractRouterType<
  typeof listCashClosingContract
>;

export const cashClosingContract = {
  list: listCashClosingContract,
};
