import { implement, ORPCError } from "@orpc/server";
import { and, asc, eq, getTableColumns, sql } from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import { MedicineTable, PurchaseItemTable, VendorTable } from "@/db/schemas";
import { buildPaginateOptions, buildPaginationMeta } from "@/db/utils";
import { apiResponse } from "@/lib/apiResponse";
import {
  authMiddleware,
  userPermissionMiddleware,
} from "@/server/middleware/auth.middleware";
import { errorMiddleware } from "@/server/middleware/error.middleware";
import type { ORPCContext } from "@/types/orpc.types";

import { medicineContract } from "./medicine.contract";

export const medicineImpl = implement(medicineContract)
  .$context<ORPCContext>()
  .use(authMiddleware)
  .use(errorMiddleware);

export const listMedicineProcedure = medicineImpl.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "medicine", action: "manage" },
      { level: "system", resource: "medicine", action: "list" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        name: MedicineTable.name,
        genericName: MedicineTable.genericName,
        barcode: MedicineTable.barcode,
        createdAt: MedicineTable.createdAt,
      },
      input
    );

    const stockByMedicine = context.db
      .select({
        medicineId: PurchaseItemTable.medicineId,
        stockRemaining: sql<number>`SUM(${PurchaseItemTable.qtyRemaining})`.as(
          "stock_remaining"
        ),
      })
      .from(PurchaseItemTable)
      .groupBy(PurchaseItemTable.medicineId)
      .as("stock_by_medicine");

    const [totalCountResult, medicines] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(MedicineTable)
        .where(where),
      context.db
        .select({
          ...getTableColumns(MedicineTable),
          vendor: {
            id: VendorTable.id,
            name: VendorTable.name,
          },
          stockRemaining:
            sql<number>`COALESCE(${stockByMedicine.stockRemaining}, 0)`.as(
              "stock_remaining"
            ),
          costPrice: sql<number | null>`(
            SELECT pi.cost_per_unit
            FROM purchase_items AS pi
            WHERE pi.medicine_id = ${MedicineTable.id}
            ORDER BY pi.created_at DESC
            LIMIT 1
          )`.as("cost_price"),
          sellPrice: sql<number | null>`(
            SELECT pi.sell_per_unit
            FROM purchase_items AS pi
            WHERE pi.medicine_id = ${MedicineTable.id}
            ORDER BY pi.created_at DESC
            LIMIT 1
          )`.as("sell_price"),
        })
        .from(MedicineTable)
        .leftJoin(VendorTable, eq(MedicineTable.vendorId, VendorTable.id))
        .leftJoin(
          stockByMedicine,
          eq(stockByMedicine.medicineId, MedicineTable.id)
        )
        .where(where)
        .offset(offset)
        .limit(limit)
        .orderBy(orderBy),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const meta = buildPaginationMeta(totalCount, medicines.length, page, limit);

    return apiResponse(API_MESSAGES.MEDICINE.GET_ALL, {
      meta,
      data: medicines,
    });
  });

export const listMedicineForSearchProcedure = medicineImpl.listForSearch
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "medicine", action: "list" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where, limit } = buildPaginateOptions(
      {
        name: MedicineTable.name,
        genericName: MedicineTable.genericName,
        strength: MedicineTable.strength,
        vendorId: MedicineTable.vendorId,
      },
      input
    );

    const medicines = await context.db
      .select({
        id: MedicineTable.id,
        name: MedicineTable.name,
        genericName: MedicineTable.genericName,
        strength: MedicineTable.strength,
        type: MedicineTable.type,
        baseUnit: MedicineTable.baseUnit,
      })
      .from(MedicineTable)
      .where(and(eq(MedicineTable.isActive, true), where))
      .orderBy(asc(MedicineTable.name))
      .limit(limit);

    return apiResponse(API_MESSAGES.MEDICINE.GET_FOR_SEARCH, medicines);
  });

export const createMedicineProcedure = medicineImpl.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "medicine", action: "manage" },
      { level: "system", resource: "medicine", action: "create" },
    ])
  )
  .handler(async ({ context, input }) => {
    const [medicine] = await context.db
      .insert(MedicineTable)
      .values(input)
      .returning();

    if (!medicine) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.MEDICINE.NOT_CREATE,
      });
    }

    return apiResponse(API_MESSAGES.MEDICINE.CREATE, medicine);
  });

export const updateMedicineProcedure = medicineImpl.update
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "medicine", action: "manage" },
      { level: "system", resource: "medicine", action: "update" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { medicineId, ...data } = input;

    const [existMedicine] = await context.db
      .select()
      .from(MedicineTable)
      .where(eq(MedicineTable.id, medicineId))
      .limit(1);

    if (!existMedicine) {
      throw new ORPCError("NOT_FOUND", {
        message: API_MESSAGES.MEDICINE.NOT_FOUND,
      });
    }

    if (Object.keys(data).length === 0) {
      return apiResponse(API_MESSAGES.MEDICINE.UPDATE, existMedicine);
    }

    const [updatedMedicine] = await context.db
      .update(MedicineTable)
      .set(data)
      .where(eq(MedicineTable.id, medicineId))
      .returning();

    if (!updatedMedicine) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.MEDICINE.NOT_UPDATE,
      });
    }

    return apiResponse(API_MESSAGES.MEDICINE.UPDATE, updatedMedicine);
  });
