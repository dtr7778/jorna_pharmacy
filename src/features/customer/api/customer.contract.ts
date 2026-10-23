import z from "zod";

import { API_MESSAGES } from "@/constants/apiMessage";
import {
  selectCustomerPaymentSchema,
  selectCustomerSchema,
} from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import {
  customerCreateSchema,
  customerPaymentCreateSchema,
  customerUpdateSchema,
} from "../customer.schema";

const customerBaseContract = baseContract.errors({
  NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.CUSTOMER.NOT_FOUND,
  },
});

const tags = ["Customer"] as const;

const customerListRowSchema = selectCustomerSchema.extend({
  dueAmount: z.number(),
  lastPurchaseAt: z.date().nullable(),
});

const listCustomerContract = baseContract
  .route({
    method: "GET",
    path: "/customers/list",
    description:
      "List of customers with their outstanding due and last purchase",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectCustomerSchema>({
      searchFields: ["name", "phone", "address"],
      orderFields: ["createdAt", "name"],
    })
  )
  .output(apiOutputSchema(paginateOutputSchema(customerListRowSchema)));
export type ListCustomerContractType = InferContractRouterType<
  typeof listCustomerContract
>;

const customerForSearchSchema = selectCustomerSchema.pick({
  id: true,
  name: true,
  phone: true,
  address: true,
});

const listCustomerForSearchContract = baseContract
  .route({
    method: "GET",
    path: "/customers/search",
    description: "List active customers for search",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectCustomerSchema>({
      searchFields: ["name", "phone", "address"],
      orderFields: [],
    })
  )
  .output(apiOutputSchema(z.array(customerForSearchSchema)));
export type ListCustomerForSearchContractType = InferContractRouterType<
  typeof listCustomerForSearchContract
>;

const createCustomerContract = baseContract
  .route({
    path: "/customers/create",
    description: "Create customer",
    tags,
  })
  .input(customerCreateSchema)
  .output(apiOutputSchema(selectCustomerSchema));
export type CreateCustomerContractType = InferContractRouterType<
  typeof createCustomerContract
>;

const updateCustomerContract = customerBaseContract
  .route({
    path: "/customers/update",
    description: "Update customer",
    tags,
  })
  .input(customerUpdateSchema.extend({ customerId: z.uuid() }))
  .output(apiOutputSchema(selectCustomerSchema));
export type UpdateCustomerContractType = InferContractRouterType<
  typeof updateCustomerContract
>;

const customerDetailsSchema = selectCustomerSchema.extend({
  summary: z.object({
    totalPurchased: z.number(),
    totalPaid: z.number(),
    dueAmount: z.number(),
    purchaseCount: z.number(),
    paymentCount: z.number(),
    lastPurchaseAt: z.date().nullable(),
  }),
});

const customerDetailsContract = customerBaseContract
  .route({
    method: "GET",
    path: "/customers/details",
    description: "Get customer details with purchase and payment summary",
    tags,
  })
  .input(z.object({ customerId: z.uuid() }))
  .output(apiOutputSchema(customerDetailsSchema));
export type CustomerDetailsContractType = InferContractRouterType<
  typeof customerDetailsContract
>;

const customerPaymentBaseContract = customerBaseContract.errors({
  CUSTOMER_NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.CUSTOMER.NOT_FOUND,
  },
  SALE_NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.SALE.NOT_FOUND,
  },
  PAYMENT_EXCEEDS: {
    status: 400,
    success: false,
    message: API_MESSAGES.CUSTOMER.PAYMENT.EXCEEDS_BALANCE,
  },
});

const customerPaymentListRowSchema = selectCustomerPaymentSchema
  .pick({
    id: true,
    customerId: true,
    saleId: true,
    amount: true,
    note: true,
    createdAt: true,
  })
  .extend({ invoiceNo: z.string().nullable() });

const listCustomerPaymentsContract = customerPaymentBaseContract
  .route({
    method: "GET",
    path: "/customers/payments",
    description: "List payments received from a customer",
    tags,
  })
  .input(
    paginateInputSchema<typeof customerPaymentListRowSchema>({
      searchFields: ["invoiceNo"],
      orderFields: ["createdAt", "amount"],
      filter: z.object({
        createdAt: z
          .object({
            from: z.coerce.date().describe("Created at from date").optional(),
            to: z.coerce.date().describe("Created at to date").optional(),
          })
          .optional(),
      }),
    }).extend({ customerId: z.uuid().optional() })
  )
  .output(apiOutputSchema(paginateOutputSchema(customerPaymentListRowSchema)));
export type ListCustomerPaymentsContractType = InferContractRouterType<
  typeof listCustomerPaymentsContract
>;

const createCustomerPaymentContract = customerPaymentBaseContract
  .route({
    path: "/customers/payments/create",
    description: "Record a payment received from a customer",
    tags,
  })
  .input(customerPaymentCreateSchema)
  .output(apiOutputSchema(selectCustomerPaymentSchema));
export type CreateCustomerPaymentContractType = InferContractRouterType<
  typeof createCustomerPaymentContract
>;

const customerPaymentStatsContract = customerPaymentBaseContract
  .route({
    method: "GET",
    path: "/customers/payments/stats",
    description: "Get customer payment stats",
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
      .extend({ customerId: z.uuid().optional() })
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
export type CustomerPaymentStatsContractType = InferContractRouterType<
  typeof customerPaymentStatsContract
>;

export const customerContract = {
  list: listCustomerContract,
  listForSearch: listCustomerForSearchContract,
  create: createCustomerContract,
  update: updateCustomerContract,
  details: customerDetailsContract,
  payment: {
    list: listCustomerPaymentsContract,
    create: createCustomerPaymentContract,
    stats: customerPaymentStatsContract,
  },
};
