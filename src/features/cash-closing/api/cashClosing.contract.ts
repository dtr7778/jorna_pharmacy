import { selectCashClosingSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import {
  cashClosingCreateSchema,
  cashClosingListFilterSchema,
} from "../cash-closing.schema";

const tags = ["Cash Closing"] as const;

const listCashClosingContract = baseContract
  .route({
    method: "GET",
    path: "/cash-closings/list",
    description:
      "List cash closings with their period, totals, counted cash, and difference",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectCashClosingSchema>({
      searchFields: [],
      orderFields: [],
      filter: cashClosingListFilterSchema,
    })
  )
  .output(
    apiOutputSchema(
      paginateOutputSchema(
        selectCashClosingSchema.pick({
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
      )
    )
  );
export type ListCashClosingContractType = InferContractRouterType<
  typeof listCashClosingContract
>;

const cashClosingCreateContract = baseContract
  .route({
    method: "GET",
    path: "/cash-closings/create",
    description: "Create cash closings",
    tags,
  })
  .input(cashClosingCreateSchema)
  .output(apiOutputSchema(selectCashClosingSchema));

export type CashClosingCreateContractType = InferContractRouterType<
  typeof cashClosingCreateContract
>;

export const cashClosingContract = {
  list: listCashClosingContract,
  create: cashClosingCreateContract,
};
