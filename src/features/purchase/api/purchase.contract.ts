import z from "zod";

import { API_MESSAGES } from "@/constants/apiMessage";
import {
  selectPurchaseItemSchema,
  selectPurchaseSchema,
  selectVendorPaymentSchema,
  selectVendorSchema,
} from "@/db/schemas";
import { userProfileSchema } from "@/features/user/user.api-schema";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { purchaseCreateSchema } from "../purchase.schema";

const selectPurchaseWithInvoiceSchema = selectPurchaseSchema.extend({
  invoiceNo: z.string(),
});

const purchaseBaseContract = baseContract.errors({
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
});

const tags = ["Purchase"] as const;

const listVendorPurchasesContract = purchaseBaseContract
  .route({
    method: "GET",
    path: "/purchases",
    description: "List purchases of a vendor",
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
    }).extend({
      vendorId: z.uuid().optional(),
      unpaidOnly: z.boolean().optional(),
    })
  )
  .output(
    apiOutputSchema(
      paginateOutputSchema(
        selectPurchaseWithInvoiceSchema
          .pick({
            id: true,
            invoiceNo: true,
            vendorInvoiceNo: true,
            vendorId: true,
            subtotal: true,
            discount: true,
            totalAmount: true,
            paidAmount: true,
            note: true,
            createdAt: true,
          })
          .extend({ vendorName: z.string() })
      )
    )
  );
export type ListVendorPurchasesContractType = InferContractRouterType<
  typeof listVendorPurchasesContract
>;

const listPurchaseForSearchContract = baseContract
  .route({
    method: "GET",
    path: "/purchases/search",
    description: "List purchases for search",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectPurchaseWithInvoiceSchema>({
      searchFields: ["invoiceNo"],
      orderFields: [],
    }).extend({
      vendorId: z.uuid().optional(),
      unpaidOnly: z.boolean().optional(),
    })
  )
  .output(
    apiOutputSchema(
      z.array(
        selectPurchaseWithInvoiceSchema
          .pick({
            id: true,
            invoiceNo: true,
            vendorInvoiceNo: true,
            vendorId: true,
            totalAmount: true,
            paidAmount: true,
          })
          .extend({ vendorName: z.string() })
      )
    )
  );
export type ListPurchaseForSearchContractType = InferContractRouterType<
  typeof listPurchaseForSearchContract
>;

const vendorPurchaseDetailsContract = purchaseBaseContract
  .route({
    method: "GET",
    path: "/purchases/details",
    description: "Get purchase details",
    tags,
  })
  .input(
    z.object({
      purchaseId: z.uuid(),
    })
  )
  .output(
    apiOutputSchema(
      selectPurchaseWithInvoiceSchema
        .pick({
          id: true,
          invoiceNo: true,
          vendorInvoiceNo: true,
          vendorId: true,
          subtotal: true,
          discount: true,
          totalAmount: true,
          paidAmount: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        })
        .extend({
          vendor: selectVendorSchema.pick({
            id: true,
            name: true,
            phone: true,
            address: true,
            note: true,
            isActive: true,
          }),
          items: z.array(
            selectPurchaseItemSchema
              .pick({
                id: true,
                medicineId: true,
                tabletsPerStrip: true,
                stripsPerBox: true,
                qtyPurchased: true,
                qtyRemaining: true,
                costPerUnit: true,
                sellPerUnit: true,
                expiryDate: true,
              })
              .extend({
                medicineName: z.string(),
                genericName: z.string().nullable(),
                strength: z.string().nullable(),
                baseUnit: z.string(),
              })
          ),
          payments: z.array(
            selectVendorPaymentSchema
              .pick({
                id: true,
                amount: true,
                note: true,
                createdAt: true,
              })
              .extend({
                createdByUser: userProfileSchema.nullable(),
              })
          ),
          createdByUser: userProfileSchema.nullable(),
          summary: z.object({
            itemCount: z.number(),
            paymentCount: z.number(),
            dueAmount: z.number(),
          }),
        })
    )
  );
export type VendorPurchaseDetailsContractType = InferContractRouterType<
  typeof vendorPurchaseDetailsContract
>;

const vendorPurchaseStatsContract = purchaseBaseContract
  .route({
    method: "GET",
    path: "/purchases/stats",
    description: "Get vendor purchase stats",
    tags,
  })
  .input(
    z.object({
      filter: z
        .object({
          createdAt: z
            .object({
              from: z.coerce.date().describe("Created at from date").optional(),
              to: z.coerce.date().describe("Created at to date").optional(),
            })
            .optional(),
        })
        .optional(),
    })
  )
  .output(
    apiOutputSchema(
      z.object({
        totalPurchased: z.number(),
        dueAmount: z.number(),
        purchaseCount: z.number(),
      })
    )
  );
export type VendorPurchaseStatsContractType = InferContractRouterType<
  typeof vendorPurchaseStatsContract
>;

const nextPurchaseInvoiceNoContract = baseContract
  .route({
    method: "GET",
    path: "/purchases/next-invoice-no",
    description: "Get the next purchase invoice number",
    tags,
  })
  .output(
    apiOutputSchema(
      z.object({
        invoiceId: z.uuid(),
        invoiceNo: z.string(),
      })
    )
  );
export type NextPurchaseInvoiceNoContractType = InferContractRouterType<
  typeof nextPurchaseInvoiceNoContract
>;

const createVendorPurchaseContract = purchaseBaseContract
  .errors({
    MEDICINE_NOT_FOUND: {
      status: 404,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.MEDICINE_NOT_FOUND,
    },
    MEDICINE_DETAILS_REQUIRED: {
      status: 400,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.MEDICINE_DETAILS_REQUIRED,
    },
    DUPLICATE_VENDOR_INVOICE: {
      status: 409,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.DUPLICATE_VENDOR_INVOICE,
    },
    INVOICE_NOT_AVAILABLE: {
      status: 409,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.INVOICE_NOT_AVAILABLE,
    },
    INVALID_AMOUNT: {
      status: 400,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.INVALID_AMOUNT,
    },
    PURCHASE_NOT_CREATE: {
      status: 500,
      success: false,
      message: API_MESSAGES.VENDOR.PURCHASE.NOT_CREATE,
    },
  })
  .route({
    method: "POST",
    path: "/purchases/create",
    description: "Create a purchase with line items and stock movements",
    tags,
  })
  .input(purchaseCreateSchema)
  .output(apiOutputSchema(selectPurchaseSchema));
export type CreateVendorPurchaseContractType = InferContractRouterType<
  typeof createVendorPurchaseContract
>;

export const purchaseContract = {
  list: listVendorPurchasesContract,
  listForSearch: listPurchaseForSearchContract,
  details: vendorPurchaseDetailsContract,
  stats: vendorPurchaseStatsContract,
  nextInvoiceNo: nextPurchaseInvoiceNoContract,
  create: createVendorPurchaseContract,
};
