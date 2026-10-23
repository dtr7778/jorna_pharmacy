import z from "zod";

import { API_MESSAGES } from "@/constants/apiMessage";
import { selectPurchaseSchema, selectVendorPaymentSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { vendorPaymentCreateSchema } from "../vendor.schema";

const vendorPaymentBaseContract = baseContract.errors({
  VENDOR_NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.VENDOR.NOT_FOUND,
  },
  PURCHASE_NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.VENDOR.PURCHASE.NOT_FOUND,
  },
  PAYMENT_EXCEEDS: {
    status: 400,
    success: false,
    message: API_MESSAGES.VENDOR.PAYMENT.EXCEEDS_BALANCE,
  },
});

const selectPurchaseWithInvoiceSchema = selectPurchaseSchema.extend({
  invoiceNo: z.string(),
});

const tags = ["Vendor"] as const;

const listVendorPaymentsContract = vendorPaymentBaseContract
  .route({
    method: "GET",
    path: "/vendors/payments",
    description: "List vendor payments",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectPurchaseWithInvoiceSchema>({
      searchFields: ["invoiceNo"],
      orderFields: [],
      filter: z.object({
        createdAt: z
          .object({
            from: z.coerce.date().describe("Created at from date").optional(),
            to: z.coerce.date().describe("Created at to date").optional(),
          })
          .optional(),
      }),
    }).extend({ vendorId: z.uuid().optional() })
  )
  .output(
    apiOutputSchema(
      paginateOutputSchema(
        selectVendorPaymentSchema
          .pick({
            id: true,
            vendorId: true,
            purchaseId: true,
            amount: true,
            note: true,
            createdAt: true,
          })
          .extend({ vendorName: z.string(), invoiceNo: z.string().nullable() })
      )
    )
  );
export type ListVendorPaymentsContractType = InferContractRouterType<
  typeof listVendorPaymentsContract
>;

const createVendorPaymentContract = vendorPaymentBaseContract
  .route({
    path: "/vendors/payments/create",
    description: "Record a payment against a purchase",
    tags,
  })
  .input(vendorPaymentCreateSchema)
  .output(apiOutputSchema(selectVendorPaymentSchema));
export type CreateVendorPaymentContractType = InferContractRouterType<
  typeof createVendorPaymentContract
>;

const vendorPaymentStatsContract = vendorPaymentBaseContract
  .route({
    method: "GET",
    path: "/vendors/payments/stats",
    description: "Get vendor payment stats",
    tags,
  })
  .input(
    z
      .object({
        filter: z
          .object({
            createdAt: z
              .object({
                from: z.coerce
                  .date()
                  .describe("Created at from date")
                  .optional(),
                to: z.coerce.date().describe("Created at to date").optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .extend({ vendorId: z.uuid().optional() })
  )
  .output(
    apiOutputSchema(
      z.object({
        totalPaid: z.number(),
        dueAmount: z.number(),
        paymentCount: z.number(),
      })
    )
  );
export type VendorPaymentStatsContractType = InferContractRouterType<
  typeof vendorPaymentStatsContract
>;

export const vendorPaymentContract = {
  list: listVendorPaymentsContract,
  create: createVendorPaymentContract,
  stats: vendorPaymentStatsContract,
};
