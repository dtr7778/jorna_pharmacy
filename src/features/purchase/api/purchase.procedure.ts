import { ORPCError } from "@orpc/client";
import { implement } from "@orpc/server";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import {
  MedicineTable,
  PurchaseInvoiceTable,
  PurchaseItemTable,
  PurchaseTable,
  RoleTable,
  StockMovementTable,
  UserRoleTable,
  UserTable,
  VendorPaymentTable,
  VendorTable,
  type InsertMedicine,
} from "@/db/schemas";
import {
  chunkByParams,
  buildPaginateOptions,
  buildPaginationMeta,
} from "@/db/utils";
import {
  userProfileColumns,
  type UserProfileType,
} from "@/features/user/user.api-schema";
import { apiResponse } from "@/lib/apiResponse";
import {
  authMiddleware,
  userPermissionMiddleware,
} from "@/server/middleware/auth.middleware";
import { errorMiddleware } from "@/server/middleware/error.middleware";
import type { ORPCContext } from "@/types/orpc.types";

import {
  getMedicineIdentity,
  getMedicineItemKey,
  normalizeMedicineName,
  resolveMedicines,
} from "../../medicine/medicineResolver";
import {
  claimInvoice,
  releaseInvoice,
  reserveInvoice,
} from "../invoiceResolver";
import { purchaseContract } from "./purchase.contract";

export const purchaseImpl = implement(purchaseContract)
  .$context<ORPCContext>()
  .use(authMiddleware)
  .use(errorMiddleware);

export const listVendorPurchasesProcedure = purchaseImpl.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "read" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { vendorId, unpaidOnly, ...paginateInput } = input;

    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        invoiceNo: PurchaseInvoiceTable.number,
        createdAt: PurchaseTable.createdAt,
      },
      paginateInput
    );

    const whereSql: Array<SQL> = [];

    if (vendorId) {
      whereSql.push(eq(PurchaseTable.vendorId, vendorId));
    }

    if (unpaidOnly) {
      whereSql.push(
        sql`${PurchaseTable.totalAmount} > ${PurchaseTable.paidAmount}`
      );
    }

    if (where) {
      whereSql.push(where);
    }

    const [totalCountResult, purchases] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(PurchaseTable)
        .innerJoin(
          PurchaseInvoiceTable,
          eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
        )
        .where(and(...whereSql)),
      context.db
        .select({
          id: PurchaseTable.id,
          invoiceNo: PurchaseInvoiceTable.number,
          vendorInvoiceNo: PurchaseTable.vendorInvoiceNo,
          vendorId: PurchaseTable.vendorId,
          vendorName: VendorTable.name,
          subtotal: PurchaseTable.subtotal,
          discount: PurchaseTable.discount,
          totalAmount: PurchaseTable.totalAmount,
          paidAmount: PurchaseTable.paidAmount,
          note: PurchaseTable.note,
          createdAt: PurchaseTable.createdAt,
        })
        .from(PurchaseTable)
        .innerJoin(VendorTable, eq(PurchaseTable.vendorId, VendorTable.id))
        .innerJoin(
          PurchaseInvoiceTable,
          eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
        )
        .where(and(...whereSql))
        .orderBy(desc(PurchaseTable.createdAt), orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const meta = buildPaginationMeta(totalCount, purchases.length, page, limit);

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.GET_ALL, {
      meta,
      data: purchases,
    });
  });

export const listPurchaseForSearchProcedure = purchaseImpl.listForSearch
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "read" },
    ])
  )
  .handler(async ({ input, context }) => {
    const { vendorId, unpaidOnly, ...paginateInput } = input;

    const { where } = buildPaginateOptions(
      {
        invoiceNo: PurchaseInvoiceTable.number,
      },
      paginateInput
    );

    const whereSql: Array<SQL> = [];

    if (vendorId) {
      whereSql.push(eq(PurchaseTable.vendorId, vendorId));
    }

    if (unpaidOnly) {
      whereSql.push(
        sql`${PurchaseTable.totalAmount} > ${PurchaseTable.paidAmount}`
      );
    }

    if (where) {
      whereSql.push(where);
    }

    const purchases = await context.db
      .select({
        id: PurchaseTable.id,
        invoiceNo: PurchaseInvoiceTable.number,
        vendorInvoiceNo: PurchaseTable.vendorInvoiceNo,
        vendorId: PurchaseTable.vendorId,
        vendorName: VendorTable.name,
        totalAmount: PurchaseTable.totalAmount,
        paidAmount: PurchaseTable.paidAmount,
      })
      .from(PurchaseTable)
      .innerJoin(VendorTable, eq(PurchaseTable.vendorId, VendorTable.id))
      .innerJoin(
        PurchaseInvoiceTable,
        eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
      )
      .where(and(...whereSql))
      .orderBy(desc(PurchaseTable.createdAt));

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.GET_FOR_SEARCH, purchases);
  });

export const vendorPurchaseDetailsProcedure = purchaseImpl.details
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "read" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const [purchase] = await context.db
      .select({
        id: PurchaseTable.id,
        invoiceNo: PurchaseInvoiceTable.number,
        vendorInvoiceNo: PurchaseTable.vendorInvoiceNo,
        vendorId: PurchaseTable.vendorId,
        subtotal: PurchaseTable.subtotal,
        discount: PurchaseTable.discount,
        totalAmount: PurchaseTable.totalAmount,
        paidAmount: PurchaseTable.paidAmount,
        note: PurchaseTable.note,
        createdBy: PurchaseTable.createdBy,
        createdAt: PurchaseTable.createdAt,
        updatedAt: PurchaseTable.updatedAt,
        vendorName: VendorTable.name,
        vendorPhone: VendorTable.phone,
        vendorAddress: VendorTable.address,
        vendorNote: VendorTable.note,
        vendorIsActive: VendorTable.isActive,
      })
      .from(PurchaseTable)
      .innerJoin(VendorTable, eq(PurchaseTable.vendorId, VendorTable.id))
      .innerJoin(
        PurchaseInvoiceTable,
        eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
      )
      .where(eq(PurchaseTable.id, input.purchaseId))
      .limit(1);

    if (!purchase) {
      throw errors.PURCHASE_NOT_FOUND();
    }

    let createdByUser: UserProfileType | null = null;

    if (purchase.createdBy) {
      const [createdBy] = await context.db
        .select(userProfileColumns)
        .from(UserTable)
        .innerJoin(UserRoleTable, eq(UserRoleTable.userId, UserTable.id))
        .innerJoin(RoleTable, eq(UserRoleTable.roleId, RoleTable.id))
        .where(eq(UserTable.id, purchase.createdBy))
        .limit(1);

      if (!createdBy) {
        throw new ORPCError("NOT_FOUND", {
          message: API_MESSAGES.USER.NOT_FOUND,
        });
      }

      createdByUser = createdBy;
    }

    const [items, payments] = await Promise.all([
      context.db
        .select({
          id: PurchaseItemTable.id,
          medicineId: PurchaseItemTable.medicineId,
          medicineName: MedicineTable.name,
          genericName: MedicineTable.genericName,
          strength: MedicineTable.strength,
          baseUnit: MedicineTable.baseUnit,
          tabletsPerStrip: PurchaseItemTable.tabletsPerStrip,
          stripsPerBox: PurchaseItemTable.stripsPerBox,
          qtyPurchased: PurchaseItemTable.qtyPurchased,
          qtyRemaining: PurchaseItemTable.qtyRemaining,
          costPerUnit: PurchaseItemTable.costPerUnit,
          sellPerUnit: PurchaseItemTable.sellPerUnit,
          expiryDate: PurchaseItemTable.expiryDate,
        })
        .from(PurchaseItemTable)
        .innerJoin(
          MedicineTable,
          eq(PurchaseItemTable.medicineId, MedicineTable.id)
        )
        .where(eq(PurchaseItemTable.purchaseId, input.purchaseId))
        .orderBy(asc(MedicineTable.name)),
      context.db
        .select({
          id: VendorPaymentTable.id,
          amount: VendorPaymentTable.amount,
          note: VendorPaymentTable.note,
          createdAt: VendorPaymentTable.createdAt,
          createdByUser: userProfileColumns,
        })
        .from(VendorPaymentTable)
        .leftJoin(UserTable, eq(VendorPaymentTable.createdBy, UserTable.id))
        .leftJoin(UserRoleTable, eq(UserRoleTable.userId, UserTable.id))
        .leftJoin(RoleTable, eq(UserRoleTable.roleId, RoleTable.id))
        .where(eq(VendorPaymentTable.purchaseId, input.purchaseId))
        .orderBy(desc(VendorPaymentTable.createdAt)),
    ]);

    const totalAmount = purchase.totalAmount;
    const paidAmount = purchase.paidAmount;

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.GET_DETAILS, {
      id: purchase.id,
      invoiceNo: purchase.invoiceNo,
      vendorInvoiceNo: purchase.vendorInvoiceNo,
      vendorId: purchase.vendorId,
      subtotal: purchase.subtotal,
      discount: purchase.discount,
      totalAmount: purchase.totalAmount,
      paidAmount: purchase.paidAmount,
      note: purchase.note,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      vendor: {
        id: purchase.vendorId,
        name: purchase.vendorName,
        phone: purchase.vendorPhone,
        address: purchase.vendorAddress,
        note: purchase.vendorNote,
        isActive: purchase.vendorIsActive,
      },
      createdByUser,
      items,
      payments,
      summary: {
        itemCount: items.length,
        paymentCount: payments.length,
        dueAmount: Math.max(totalAmount - paidAmount, 0),
      },
    });
  });

export const nextPurchaseInvoiceNoProcedure = purchaseImpl.nextInvoiceNo
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "create" },
    ])
  )
  .handler(async ({ context }) => {
    const invoice = await reserveInvoice(context.db, context.user.id);

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.GET_NEXT_INVOICE_NO, {
      invoiceId: invoice.id,
      invoiceNo: invoice.number,
    });
  });

export const createVendorPurchaseProcedure = purchaseImpl.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "create" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const [vendor] = await context.db
      .select({ id: VendorTable.id })
      .from(VendorTable)
      .where(eq(VendorTable.id, input.vendorId))
      .limit(1);

    if (!vendor) {
      throw errors.VENDOR_NOT_FOUND();
    }

    const medicineNames = [
      ...new Set(
        input.items.map((item) =>
          normalizeMedicineName(getMedicineIdentity(item).name)
        )
      ),
    ];

    const medicineResults = await Promise.all(
      chunkByParams(medicineNames, 1).map((names) =>
        context.db
          .select({
            id: MedicineTable.id,
            name: MedicineTable.name,
            genericName: MedicineTable.genericName,
            strength: MedicineTable.strength,
          })
          .from(MedicineTable)
          .where(
            and(
              inArray(sql`lower(trim(${MedicineTable.name}))`, names),
              eq(MedicineTable.vendorId, vendor.id),
              eq(MedicineTable.isActive, true)
            )
          )
      )
    );
    const resolvedMedicines = resolveMedicines(
      input.items,
      medicineResults.flat()
    );

    if (resolvedMedicines.unresolvedNames.length > 0) {
      throw errors.MEDICINE_DETAILS_REQUIRED();
    }

    const newMedicineRows: Array<InsertMedicine> =
      resolvedMedicines.newMedicines.map((medicine) => ({
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        strength: medicine.strength,
        type: medicine.type,
        baseUnit: medicine.baseUnit,
        vendorId: vendor.id,
      }));

    if (input.vendorInvoiceNo) {
      const [duplicateInvoice] = await context.db
        .select({ id: PurchaseTable.id })
        .from(PurchaseTable)
        .where(
          and(
            eq(PurchaseTable.vendorId, input.vendorId),
            eq(PurchaseTable.vendorInvoiceNo, input.vendorInvoiceNo)
          )
        )
        .limit(1);

      if (duplicateInvoice) {
        throw errors.DUPLICATE_VENDOR_INVOICE();
      }
    }

    const subtotal = input.items.reduce(
      (total, item) => total + item.qtyPurchased * item.costPerUnit,
      0
    );
    const totalAmount = subtotal;

    const purchaseId = crypto.randomUUID();

    const purchaseItemRows = input.items.map((item) => {
      const medicineId = resolvedMedicines.medicineIdByKey.get(
        getMedicineItemKey(item)
      );

      if (!medicineId) {
        throw errors.MEDICINE_NOT_FOUND();
      }

      return {
        id: crypto.randomUUID(),
        purchaseId,
        medicineId,
        tabletsPerStrip: item.tabletsPerStrip ?? null,
        stripsPerBox: item.stripsPerBox ?? null,
        qtyPurchased: item.qtyPurchased,
        qtyRemaining: item.qtyPurchased,
        costPerUnit: item.costPerUnit,
        sellPerUnit: item.sellPerUnit,
        expiryDate: item.expiryDate ?? null,
      };
    });

    const stockMovementRows = purchaseItemRows.map((item) => ({
      purchaseItemId: item.id,
      movementType: "purchase" as const,
      qtyChange: item.qtyPurchased,
      refTable: "purchases",
      refId: purchaseId,
      createdBy: context.user.id,
    }));

    const paymentStatement =
      input.paidAmount > 0
        ? [
            context.db.insert(VendorPaymentTable).values({
              vendorId: input.vendorId,
              purchaseId,
              amount: input.paidAmount,
              note: "Initial payment recorded with purchase.",
              createdBy: context.user.id,
            }),
          ]
        : [];

    const medicineStatements = chunkByParams(newMedicineRows, 4).map((chunk) =>
      context.db.insert(MedicineTable).values(chunk)
    );
    const itemStatements = chunkByParams(purchaseItemRows, 11).map((chunk) =>
      context.db.insert(PurchaseItemTable).values(chunk)
    );
    const stockMovementStatements = chunkByParams(stockMovementRows, 6).map(
      (chunk) => context.db.insert(StockMovementTable).values(chunk)
    );

    const claimedInvoice = await claimInvoice(
      context.db,
      input.invoiceId,
      context.user.id
    );

    if (!claimedInvoice) {
      throw errors.INVOICE_NOT_AVAILABLE();
    }

    const [purchaseRows] = await context.db
      .batch([
        context.db
          .insert(PurchaseTable)
          .values({
            id: purchaseId,
            vendorId: input.vendorId,
            vendorInvoiceNo: input.vendorInvoiceNo ?? null,
            invoiceId: input.invoiceId,
            subtotal,
            totalAmount,
            paidAmount: input.paidAmount,
            note: input.note ?? null,
            createdBy: context.user.id,
          })
          .returning(),
        ...medicineStatements,
        ...itemStatements,
        ...stockMovementStatements,
        ...paymentStatement,
      ])
      .catch(async (error) => {
        await releaseInvoice(context.db, input.invoiceId);
        throw error;
      });

    const purchase = purchaseRows[0];

    if (!purchase) {
      throw errors.PURCHASE_NOT_CREATE();
    }

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.CREATE, purchase);
  });

export const vendorPurchaseStatsProcedure = purchaseImpl.stats
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "purchase", action: "manage" },
      { level: "system", resource: "purchase", action: "read" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where } = buildPaginateOptions(
      {
        createdAt: PurchaseTable.createdAt,
      },
      { filter: input.filter }
    );

    const [purchaseTotals, dueTotals] = await Promise.all([
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${PurchaseTable.totalAmount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(PurchaseTable)
        .where(where),
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${PurchaseTable.totalAmount} - ${PurchaseTable.paidAmount}), 0)`,
        })
        .from(PurchaseTable),
    ]);

    return apiResponse(API_MESSAGES.VENDOR.PURCHASE.GET_STATS, {
      totalPurchased: Number(purchaseTotals[0]?.total ?? 0),
      dueAmount: Number(dueTotals[0]?.total ?? 0),
      purchaseCount: Number(purchaseTotals[0]?.count ?? 0),
    });
  });
