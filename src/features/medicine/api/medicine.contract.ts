import z from "zod";

import { selectMedicineSchema, selectVendorSchema } from "@/db/schemas";
import { apiOutputSchema } from "@/lib/zod-schemas/apiOutputSchema";
import { paginateInputSchema } from "@/lib/zod-schemas/paginateInputSchema";
import { paginateOutputSchema } from "@/lib/zod-schemas/paginateOutputSchema";
import { baseContract } from "@/server/orpc.contract-base";
import type { InferContractRouterType } from "@/types/orpc.types";

import { medicineCreateSchema, medicineUpdateSchema } from "../medicine.schema";

const tags = ["Medicine"] as const;

const listMedicineContract = baseContract
  .route({
    method: "GET",
    path: "/medicines/list",
    description: "List of medicines",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectMedicineSchema>({
      searchFields: ["name", "genericName", "barcode"],
      orderFields: ["createdAt", "name"],
    })
  )
  .output(
    apiOutputSchema(
      paginateOutputSchema(
        selectMedicineSchema.extend({
          vendor: selectVendorSchema
            .pick({
              id: true,
              name: true,
            })
            .nullable(),
          stockRemaining: z.number(),
          costPrice: z.number().nullable(),
          sellPrice: z.number().nullable(),
        })
      )
    )
  );
export type ListMedicineContractType = InferContractRouterType<
  typeof listMedicineContract
>;

const listMedicineForSearchContract = baseContract
  .route({
    method: "GET",
    path: "/medicines/search",
    description: "List medicines for search",
    tags,
  })
  .input(
    paginateInputSchema<typeof selectMedicineSchema>({
      searchFields: ["name", "genericName", "strength"],
      orderFields: ["name"],
      filter: z.object({
        vendorId: z.uuid().optional(),
      }),
    })
  )
  .output(
    apiOutputSchema(
      z.array(
        selectMedicineSchema.pick({
          id: true,
          name: true,
          genericName: true,
          strength: true,
          type: true,
          baseUnit: true,
        })
      )
    )
  );
export type ListMedicineForSearchContractType = InferContractRouterType<
  typeof listMedicineForSearchContract
>;

const createMedicineContract = baseContract
  .route({
    path: "/medicines/create",
    description: "Create medicine",
    tags,
  })
  .input(medicineCreateSchema)
  .output(apiOutputSchema(selectMedicineSchema));
export type CreateMedicineContractType = InferContractRouterType<
  typeof createMedicineContract
>;

const updateMedicineContract = baseContract
  .route({
    path: "/medicines/update",
    description: "Update medicine",
    tags,
  })
  .input(medicineUpdateSchema.extend({ medicineId: z.uuid() }))
  .output(apiOutputSchema(selectMedicineSchema));
export type UpdateMedicineContractType = InferContractRouterType<
  typeof updateMedicineContract
>;

export const medicineContract = {
  list: listMedicineContract,
  listForSearch: listMedicineForSearchContract,
  create: createMedicineContract,
  update: updateMedicineContract,
};
