import { ORPCError } from "@orpc/client";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import {
  PurchaseInvoiceTable,
  PurchaseTable,
  VendorPaymentTable,
  VendorTable,
} from "@/db/schemas";
import { buildPaginateOptions, buildPaginationMeta } from "@/db/utils";
import { apiResponse } from "@/lib/apiResponse";
import { userPermissionMiddleware } from "@/server/middleware/auth.middleware";

import { vendorImpl } from "./vendor.procedure";

export const listVendorPaymentsProcedure = vendorImpl.payment.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor_payment", action: "manage" },
      { level: "system", resource: "vendor_payment", action: "read" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { vendorId, ...paginateInput } = input;

    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        invoiceNo: PurchaseInvoiceTable.number,
        createdAt: VendorPaymentTable.createdAt,
      },
      paginateInput
    );

    const whereSql: Array<SQL> = [];

    if (vendorId) {
      whereSql.push(eq(VendorPaymentTable.vendorId, vendorId));
    }

    if (where) {
      whereSql.push(where);
    }

    const [totalCountResult, payments] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(VendorPaymentTable)
        .leftJoin(
          PurchaseTable,
          eq(VendorPaymentTable.purchaseId, PurchaseTable.id)
        )
        .leftJoin(
          PurchaseInvoiceTable,
          eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
        )
        .innerJoin(VendorTable, eq(VendorPaymentTable.vendorId, VendorTable.id))
        .where(and(...whereSql)),
      context.db
        .select({
          id: VendorPaymentTable.id,
          vendorId: VendorPaymentTable.vendorId,
          purchaseId: VendorPaymentTable.purchaseId,
          invoiceNo: PurchaseInvoiceTable.number,
          vendorName: VendorTable.name,
          amount: VendorPaymentTable.amount,
          note: VendorPaymentTable.note,
          createdAt: VendorPaymentTable.createdAt,
        })
        .from(VendorPaymentTable)
        .leftJoin(
          PurchaseTable,
          eq(VendorPaymentTable.purchaseId, PurchaseTable.id)
        )
        .leftJoin(
          PurchaseInvoiceTable,
          eq(PurchaseTable.invoiceId, PurchaseInvoiceTable.id)
        )
        .innerJoin(VendorTable, eq(VendorPaymentTable.vendorId, VendorTable.id))
        .where(and(...whereSql))
        .orderBy(desc(VendorPaymentTable.createdAt), orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    const meta = buildPaginationMeta(totalCount, payments.length, page, limit);

    return apiResponse(API_MESSAGES.VENDOR.PAYMENT.GET_ALL, {
      meta,
      data: payments,
    });
  });

export const createVendorPaymentProcedure = vendorImpl.payment.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor_payment", action: "manage" },
      { level: "system", resource: "vendor_payment", action: "create" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const { vendorId, purchaseId, amount, note } = input;

    const [vendor] = await context.db
      .select()
      .from(VendorTable)
      .where(eq(VendorTable.id, vendorId))
      .limit(1);

    if (!vendor) {
      throw errors.VENDOR_NOT_FOUND();
    }

    if (purchaseId) {
      const [purchase] = await context.db
        .select()
        .from(PurchaseTable)
        .where(eq(PurchaseTable.id, purchaseId))
        .limit(1);

      if (!purchase) {
        throw errors.PURCHASE_NOT_FOUND();
      }

      const remaining = purchase.totalAmount - purchase.paidAmount;

      if (amount > remaining) {
        throw errors.PAYMENT_EXCEEDS();
      }
    }

    const [payment] = await context.db
      .insert(VendorPaymentTable)
      .values({
        vendorId,
        purchaseId,
        amount,
        note,
        createdBy: context.user.id,
      })
      .returning();

    if (!payment) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.VENDOR.PAYMENT.NOT_CREATE,
      });
    }

    if (purchaseId) {
      await context.db
        .update(PurchaseTable)
        .set({ paidAmount: sql`${PurchaseTable.paidAmount} + ${amount}` })
        .where(eq(PurchaseTable.id, purchaseId));
    }

    return apiResponse(API_MESSAGES.VENDOR.PAYMENT.CREATE, payment);
  });

export const vendorPaymentStatsProcedure = vendorImpl.payment.stats
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor_payment", action: "manage" },
      { level: "system", resource: "vendor_payment", action: "read" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where } = buildPaginateOptions(
      {
        createdAt: VendorPaymentTable.createdAt,
      },
      { filter: input.filter }
    );

    const [paymentTotals, dueTotals] = await Promise.all([
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${VendorPaymentTable.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(VendorPaymentTable)
        .where(where),
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${PurchaseTable.totalAmount} - ${PurchaseTable.paidAmount}), 0)`,
        })
        .from(PurchaseTable),
    ]);

    return apiResponse(API_MESSAGES.VENDOR.PAYMENT.GET_STATS, {
      totalPaid: Number(paymentTotals[0]?.total ?? 0),
      dueAmount: Number(dueTotals[0]?.total ?? 0),
      paymentCount: Number(paymentTotals[0]?.count ?? 0),
    });
  });
