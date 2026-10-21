import z from "zod";

import { API_MESSAGES } from "@/constants/apiMessage";
import { selectVendorSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { vendorCreateSchema, vendorUpdateSchema } from "../vendor.schema";
import { vendorPaymentContract } from "./vendorPyament.contract";

const vendorBaseContract = baseContract.errors({
  NOT_FOUND: {
    status: 404,
    success: false,
    message: API_MESSAGES.VENDOR.NOT_FOUND,
  },
});

const tags = ["Vendor"] as const;

const listVendorContract = baseContract
  .route({
    method: "GET",
    path: "/vendors/list",
    description: "List of vendors",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectVendorSchema>({
      searchFields: ["name", "phone"],
      orderFields: ["createdAt", "name"],
    })
  )
  .output(apiOutputSchema(paginateOutputSchema(selectVendorSchema)));
export type ListVendorContractType = InferContractRouterType<
  typeof listVendorContract
>;

const vendorForSearchSchema = selectVendorSchema.pick({
  id: true,
  name: true,
  phone: true,
});

const listVendorForSearchContract = baseContract
  .route({
    method: "GET",
    path: "/vendors/search",
    description: "List vendors for search",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectVendorSchema>({
      searchFields: ["name", "phone"],
      orderFields: [],
    })
  )
  .output(apiOutputSchema(z.array(vendorForSearchSchema)));
export type ListVendorForSearchContractType = InferContractRouterType<
  typeof listVendorForSearchContract
>;

const createVendorContract = baseContract
  .route({
    path: "/vendors/create",
    description: "Create vendor",
    tags,
  })
  .input(vendorCreateSchema)
  .output(apiOutputSchema(selectVendorSchema));
export type CreateVendorContractType = InferContractRouterType<
  typeof createVendorContract
>;

const updateVendorContract = vendorBaseContract
  .route({
    path: "/vendors/update",
    description: "Update vendor",
    tags,
  })
  .input(vendorUpdateSchema.extend({ vendorId: z.uuid() }))
  .output(apiOutputSchema(selectVendorSchema));
export type UpdateVendorContractType = InferContractRouterType<
  typeof updateVendorContract
>;

const vendorDetailsSchema = selectVendorSchema.extend({
  summary: z.object({
    totalPurchased: z.number(),
    totalPaid: z.number(),
    balance: z.number(),
    purchaseCount: z.number(),
    paymentCount: z.number(),
  }),
});

const vendorDetailsContract = vendorBaseContract
  .route({
    method: "GET",
    path: "/vendors/details",
    description: "Get vendor details",
    tags,
  })
  .input(z.object({ vendorId: z.uuid() }))
  .output(apiOutputSchema(vendorDetailsSchema));
export type VendorDetailsContractType = InferContractRouterType<
  typeof vendorDetailsContract
>;

export const vendorContract = {
  list: listVendorContract,
  listForSearch: listVendorForSearchContract,
  create: createVendorContract,
  update: updateVendorContract,
  details: vendorDetailsContract,
  payment: vendorPaymentContract,
};
