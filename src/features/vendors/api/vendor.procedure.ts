import { implement, ORPCError } from "@orpc/server";
import { eq, sql } from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import { PurchaseTable, VendorPaymentTable, VendorTable } from "@/db/schemas";
import { buildPaginateOptions, buildPaginationMeta } from "@/db/utils";
import { apiResponse } from "@/lib/apiResponse";
import {
  authMiddleware,
  userPermissionMiddleware,
} from "@/server/middleware/auth.middleware";
import { errorMiddleware } from "@/server/middleware/error.middleware";
import type { ORPCContext } from "@/types/orpc.types";

import { vendorContract } from "./vendor.contract";

export const vendorImpl = implement(vendorContract)
  .$context<ORPCContext>()
  .use(authMiddleware)
  .use(errorMiddleware);

export const listVendorProcedure = vendorImpl.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor", action: "manage" },
      { level: "system", resource: "vendor", action: "list" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        name: VendorTable.name,
        phone: VendorTable.phone,
        createdAt: VendorTable.createdAt,
      },
      input
    );

    const [totalCount, vendors] = await Promise.all([
      context.db.$count(VendorTable),
      context.db
        .select()
        .from(VendorTable)
        .where(where)
        .offset(offset)
        .limit(limit)
        .orderBy(orderBy),
    ]);

    const meta = buildPaginationMeta(totalCount, vendors.length, page, limit);

    return apiResponse(API_MESSAGES.VENDOR.GET_ALL, { meta, data: vendors });
  });

export const listVendorForSearchProcedure = vendorImpl.listForSearch
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor", action: "manage" },
      { level: "system", resource: "vendor", action: "list" },
    ])
  )
  .handler(async ({ input, context }) => {
    const { where } = buildPaginateOptions(
      {
        name: VendorTable.name,
        phone: VendorTable.phone,
      },
      input
    );

    const vendors = await context.db
      .select({
        id: VendorTable.id,
        name: VendorTable.name,
        phone: VendorTable.phone,
      })
      .from(VendorTable)
      .where(where);

    return apiResponse(API_MESSAGES.VENDOR.GET_ALL_FOR_SEARCH, vendors);
  });

export const createVendorProcedure = vendorImpl.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor", action: "manage" },
      { level: "system", resource: "vendor", action: "create" },
    ])
  )
  .handler(async ({ context, input }) => {
    const [vendor] = await context.db
      .insert(VendorTable)
      .values(input)
      .returning();

    if (!vendor) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.VENDOR.NOT_CREATE,
      });
    }

    return apiResponse(API_MESSAGES.VENDOR.CREATE, vendor);
  });

export const updateVendorProcedure = vendorImpl.update
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor", action: "manage" },
      { level: "system", resource: "vendor", action: "update" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const { vendorId, ...data } = input;

    const [existVendor] = await context.db
      .select()
      .from(VendorTable)
      .where(eq(VendorTable.id, vendorId))
      .limit(1);

    if (!existVendor) {
      throw errors.NOT_FOUND();
    }

    if (Object.keys(data).length === 0) {
      return apiResponse(API_MESSAGES.VENDOR.UPDATE, existVendor);
    }

    const [updatedVendor] = await context.db
      .update(VendorTable)
      .set(data)
      .where(eq(VendorTable.id, vendorId))
      .returning();

    if (!updatedVendor) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.VENDOR.NOT_UPDATE,
      });
    }

    return apiResponse(API_MESSAGES.VENDOR.UPDATE, updatedVendor);
  });

export const vendorDetailsProcedure = vendorImpl.details
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "vendor", action: "manage" },
      { level: "system", resource: "vendor", action: "read" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const [vendor] = await context.db
      .select()
      .from(VendorTable)
      .where(eq(VendorTable.id, input.vendorId))
      .limit(1);

    if (!vendor) {
      throw errors.NOT_FOUND();
    }

    const [purchaseTotals, paymentTotals] = await Promise.all([
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${PurchaseTable.totalAmount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(PurchaseTable)
        .where(eq(PurchaseTable.vendorId, input.vendorId)),
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${VendorPaymentTable.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(VendorPaymentTable)
        .where(eq(VendorPaymentTable.vendorId, input.vendorId)),
    ]);

    const totalPurchased = Number(purchaseTotals[0]?.total ?? 0);
    const totalPaid = Number(paymentTotals[0]?.total ?? 0);

    return apiResponse(API_MESSAGES.VENDOR.GET_DETAILS, {
      ...vendor,
      summary: {
        totalPurchased,
        totalPaid,
        balance: totalPurchased - totalPaid,
        purchaseCount: Number(purchaseTotals[0]?.count ?? 0),
        paymentCount: Number(paymentTotals[0]?.count ?? 0),
      },
    });
  });
