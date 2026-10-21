import z from "zod";

import { selectSaleSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { saleListFilterSchema } from "../sale.schema";

const tags = ["Sale"] as const;

const selectSaleWithCustomerSchema = selectSaleSchema.extend({
  customerName: z.string().nullable(),
  itemCount: z.number(),
});

const saleListRowSchema = selectSaleSchema
  .pick({
    id: true,
    invoiceNo: true,
    customerId: true,
    subtotal: true,
    discount: true,
    totalAmount: true,
    paidAmount: true,
    createdAt: true,
  })
  .extend({
    customerName: z.string().nullable(),
    itemCount: z.number(),
  });

const listSaleContract = baseContract
  .route({
    method: "GET",
    path: "/sales/list",
    description:
      "List sales with their customer, item count, totals, and outstanding due",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectSaleWithCustomerSchema>({
      searchFields: ["invoiceNo", "customerName"],
      orderFields: ["createdAt", "invoiceNo", "totalAmount"],
      filter: saleListFilterSchema,
    }).extend({
      customerId: z.uuid().optional(),
      unpaidOnly: z.boolean().optional(),
    })
  )
  .output(apiOutputSchema(paginateOutputSchema(saleListRowSchema)));
export type ListSaleContractType = InferContractRouterType<
  typeof listSaleContract
>;

export const saleContract = {
  list: listSaleContract,
};
